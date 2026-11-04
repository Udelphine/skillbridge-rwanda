import { useEffect, useState } from 'react';
import { api } from '../api';

function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [joinedIds, setJoinedIds] = useState([]);
  const [difficulty, setDifficulty] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const list = await api('/challenges');
      const mine = await api('/participations/my');
      setChallenges(list);
      setJoinedIds(mine.map((item) => item.challenge_id));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleJoin(challengeId) {
    setMessage('');
    setError('');

    try {
      await api('/participations', {
        method: 'POST',
        body: { challenge_id: challengeId }
      });
      setMessage('You joined the challenge. Go to My Work to submit your project.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const shown = challenges.filter((item) => {
    const matchesDifficulty = !difficulty || item.difficulty === difficulty;
    const matchesCategory = !category || (item.category || '').toLowerCase().includes(category.toLowerCase());
    return matchesDifficulty && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Challenges</h1>

      <div className="flex gap-4 mb-6">
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="border rounded p-2 bg-white"
        >
          <option value="">All difficulties</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <input
          type="text"
          placeholder="Search by category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded p-2 bg-white"
        />
      </div>

      {message && <p className="bg-green-100 text-green-800 p-2 rounded mb-4">{message}</p>}
      {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</p>}

      {shown.length === 0 && <p className="text-gray-600">No challenges found.</p>}

      {shown.map((item) => (
        <div key={item.id} className="bg-white p-6 rounded shadow mb-4">
          <h2 className="text-xl font-bold">{item.title}</h2>
          <p className="text-gray-700 mt-2">{item.description}</p>

          <p className="text-sm text-gray-500 mt-3">
            Category: {item.category || 'None'} | Difficulty: {item.difficulty} | Deadline:{' '}
            {item.deadline ? item.deadline.slice(0, 10) : 'None'}
          </p>

          {joinedIds.includes(item.id) ? (
            <p className="mt-4 text-green-700 font-bold">Already joined</p>
          ) : (
            <button
              onClick={() => handleJoin(item.id)}
              className="mt-4 bg-green-700 text-white px-4 py-2 rounded"
            >
              Join challenge
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default Challenges;