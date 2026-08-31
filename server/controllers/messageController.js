const Message = require('../models/Message');
const Project = require('../models/Project');
const User = require('../models/User');
const { analyzeMessage } = require('../services/messageGuard');

// ── Send a message ────────────────────────────────────────────────────────────
// @route   POST /api/messages
// @access  Private (Client or Provider involved in the project)
const sendMessage = async (req, res) => {
  try {
    const { projectId, receiverId, content } = req.body;

    if (!projectId || !receiverId || !content?.trim()) {
      return res.status(400).json({ message: 'projectId, receiverId, and content are required.' });
    }

    // Verify the project exists and the sender is allowed to message in it
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const senderId = req.user._id.toString();
    const clientId = project.client?.toString();
    const providerId = project.awardedProvider?.toString();

    const isParticipant = senderId === clientId || senderId === providerId;
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this project.' });
    }

    // ── Run MessageGuard ──────────────────────────────────────────────────────
    const guard = analyzeMessage(content.trim());

    const message = await Message.create({
      project: projectId,
      sender: req.user._id,
      receiver: receiverId,
      content: guard.sanitized,       // sanitized version stored & shown
      rawContent: content.trim(),     // original for admin review
      flagged: guard.flagged,
      flagSeverity: guard.flagSeverity,
      flagReasons: guard.flagReasons,
      wasRedacted: guard.wasRedacted,
    });

    const populated = await message.populate('sender', 'email companyName role');

    // ── Emit via Socket.IO ────────────────────────────────────────────────────
    const io = req.app.get('io');
    if (io) {
      // Deliver to project room (both participants)
      io.to(projectId).emit('new_message', {
        message: {
          _id: populated._id,
          content: populated.content,     // sanitized
          sender: populated.sender,
          createdAt: populated.createdAt,
          wasRedacted: populated.wasRedacted,
          flagSeverity: populated.flagSeverity,
        },
      });

      // Alert admin room if flagged
      if (guard.flagged) {
        const sender = await User.findById(req.user._id).select('email companyName role');
        io.to('admin:alerts').emit('message_flagged', {
          messageId: message._id,
          projectId,
          projectTitle: project.title,
          sender: { _id: sender._id, name: sender.companyName || sender.email, role: sender.role },
          rawContent: content.trim(),
          sanitizedContent: guard.sanitized,
          flagSeverity: guard.flagSeverity,
          flagReasons: guard.flagReasons,
          wasRedacted: guard.wasRedacted,
          sentAt: message.createdAt,
        });
      }
    }

    res.status(201).json({
      message: populated,
      guardResult: {
        wasRedacted: guard.wasRedacted,
        flagged: guard.flagged,
        flagSeverity: guard.flagSeverity,
      },
    });
  } catch (error) {
    console.error('❌ [sendMessage] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── Get all messages for a project ───────────────────────────────────────────
// @route   GET /api/messages/:projectId
// @access  Private (Client or Provider involved in the project)
const getMessages = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const userId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isParticipant =
      userId === project.client?.toString() ||
      userId === project.awardedProvider?.toString();

    if (!isAdmin && !isParticipant) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const messages = await Message.find({ project: req.params.projectId, deleted: false })
      .populate('sender', 'email companyName role')
      .populate('receiver', 'email companyName role')
      .sort({ createdAt: 1 })
      .lean();

    // Non-admins never see rawContent
    if (!isAdmin) {
      messages.forEach((m) => { delete m.rawContent; });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error('❌ [getMessages] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── Admin: Get all flagged messages (across all projects) ─────────────────────
// @route   GET /api/messages/flagged
// @access  Private (Admin only)
const getFlaggedMessages = async (req, res) => {
  try {
    const { resolution = 'pending', severity } = req.query;

    const filter = { flagged: true };
    if (resolution !== 'all') filter.flagResolution = resolution;
    if (severity) filter.flagSeverity = severity;

    const messages = await Message.find(filter)
      .populate('sender', 'email companyName role')
      .populate('receiver', 'email companyName role')
      .populate('project', 'title')
      .populate('flagReviewedBy', 'email')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.status(200).json(messages);
  } catch (error) {
    console.error('❌ [getFlaggedMessages] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── Admin: Resolve a flagged message ─────────────────────────────────────────
// @route   PUT /api/messages/:id/resolve
// @access  Private (Admin only)
const resolveFlag = async (req, res) => {
  try {
    const { resolution, adminNote } = req.body;
    const validResolutions = ['dismissed', 'warned', 'banned'];
    if (!validResolutions.includes(resolution)) {
      return res.status(400).json({ message: `Resolution must be one of: ${validResolutions.join(', ')}` });
    }

    const message = await Message.findById(req.params.id)
      .populate('sender', 'email companyName role')
      .populate('project', 'title');

    if (!message) return res.status(404).json({ message: 'Message not found.' });
    if (!message.flagged) return res.status(400).json({ message: 'This message is not flagged.' });

    message.flagResolution = resolution;
    message.flagReviewedBy = req.user._id;
    message.flagReviewedAt = new Date();
    message.adminNote = adminNote || '';
    await message.save();

    // If 'warned' — notify the sender via socket
    const io = req.app.get('io');
    if (io && resolution === 'warned') {
      io.to(message.sender._id.toString()).emit('platform_warning', {
        title: 'Platform Warning',
        message: `Your message in project "${message.project?.title}" was flagged for attempting to share contact information. Repeated violations may result in account suspension.`,
        severity: 'warning',
      });
    }

    // If 'banned' — disable the sender's account
    if (resolution === 'banned') {
      await User.findByIdAndUpdate(message.sender._id, { isBanned: true });
      if (io) {
        io.to(message.sender._id.toString()).emit('account_banned', {
          message: 'Your account has been suspended for violating platform communication policies.',
        });
      }
    }

    // Notify admin room that flag was resolved
    if (io) {
      io.to('admin:alerts').emit('flag_resolved', {
        messageId: message._id,
        resolution,
        resolvedBy: req.user.email,
      });
    }

    res.status(200).json({ message: `Flag resolved as "${resolution}".`, flaggedMessage: message });
  } catch (error) {
    console.error('❌ [resolveFlag] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── Get unresolved flag count (for admin badge) ───────────────────────────────
// @route   GET /api/messages/flagged/count
// @access  Private (Admin only)
const getFlaggedCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ flagged: true, flagResolution: 'pending' });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { sendMessage, getMessages, getFlaggedMessages, resolveFlag, getFlaggedCount };
