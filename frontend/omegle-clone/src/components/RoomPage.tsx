import { Link } from 'react-router-dom';

const RoomPage = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to the Room Page</h1>
        <Link to="/" className="text-blue-500 hover:text-blue-700">Back to Landing Page</Link>
      </div>
    </div>
  );
};

export default RoomPage;
