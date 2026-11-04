import { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('Checking server...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setMessage('Server status: ' + data.status))
      .catch(() => setMessage('Cannot reach the server'));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow text-center">
        <h1 className="text-3xl font-bold text-green-700">SkillBridge Rwanda</h1>
        <p className="mt-4 text-gray-700">{message}</p>
      </div>
    </div>
  );
}

export default App;