import { useParams } from 'react-router-dom';

const LiveAuction = () => {
  const { projectId } = useParams();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-12 text-center shadow-xl">
        <h1 className="text-4xl font-bold text-purple-400 mb-3">Live Auction</h1>
        <p className="text-gray-400 text-lg">
          Project ID: <span className="text-white font-mono">{projectId}</span>
        </p>
        <p className="text-gray-500 mt-2">Real-time bidding will happen here.</p>
      </div>
    </div>
  );
};

export default LiveAuction;
