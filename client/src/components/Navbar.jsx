import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="bg-green-700 text-white px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-bold">SkillBridge Rwanda</Link>

        {user && user.role === 'student' && (
          <>
            <Link to="/challenges">Challenges</Link>
            <Link to="/my-work">My Work</Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span>{user.name} ({user.role})</span>
            <button onClick={handleLogout} className="bg-white text-green-700 px-3 py-1 rounded">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;