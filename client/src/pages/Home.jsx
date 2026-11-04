import { useAuth } from '../AuthContext';

function Home() {
  const { user } = useAuth();

  const messages = {
    student: 'Browse challenges, submit your work and build your portfolio.',
    mentor: 'Review the submissions assigned to you.',
    admin: 'Manage challenges, users and see platform activity.'
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 bg-white p-8 rounded shadow">
      <h1 className="text-2xl font-bold mb-2">Welcome, {user.name}</h1>
      <p className="text-gray-700">{messages[user.role]}</p>
    </div>
  );
}

export default Home;