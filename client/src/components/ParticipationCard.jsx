import { useEffect, useState } from 'react';
import { api } from '../api';

const statusNames = {
  draft: 'Draft',
  submitted: 'Submitted, waiting for a mentor',
  in_review: 'In review',
  revision_requested: 'Revision requested',
  reviewed: 'Reviewed'
};

function ParticipationCard({ participation, submission, reload }) {
  const [summary, setSummary] = useState(submission ? submission.summary : '');
  const [repositoryUrl, setRepositoryUrl] = useState(submission && submission.repository_url ? submission.repository_url : '');
  const [demoUrl, setDemoUrl] = useState(submission && submission.demo_url ? submission.demo_url : '');
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submissionId = submission ? submission.id : null;
  const status = submission ? submission.status : '';
  const canEdit = !submission || status === 'draft' || status === 'revision_requested';

  useEffect(() => {
    if (submissionId) {
      api('/reviews/submission/' + submissionId)
        .then(setReviews)
        .catch(() => setReviews([]));
    }
  }, [submissionId, status]);

  async function handleSave(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    const body = {
      summary: summary,
      repository_url: repositoryUrl,
      demo_url: demoUrl
    };

    try {
      if (submission) {
        await api('/submissions/' + submission.id, { method: 'PUT', body: body });
      } else {
        await api('/submissions', {
          method: 'POST',
          body: { ...body, participation_id: participation.id }
        });
      }
      setMessage('Saved');
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit() {
    setMessage('');
    setError('');

    try {
      await api('/submissions/' + submission.id + '/submit', { method: 'POST' });
      setMessage('Submitted for review');
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="bg-white p-6 rounded shadow mb-6">
      <h2 className="text-xl font-bold">{participation.title}</h2>
      <p className="text-sm text-gray-500 mb-4">
        Deadline: {participation.deadline ? participation.deadline.slice(0, 10) : 'None'}
        {submission && ' | Status: ' + statusNames[status]}
      </p>

      {message && <p className="bg-green-100 text-green-800 p-2 rounded mb-4">{message}</p>}
      {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</p>}

      {canEdit ? (
        <form onSubmit={handleSave}>
          <label className="block mb-1">Project summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full border rounded p-2 mb-4"
            rows="3"
            required
          />

          <label className="block mb-1">Repository link</label>
          <input
            type="text"
            value={repositoryUrl}
            onChange={(e) => setRepositoryUrl(e.target.value)}
            className="w-full border rounded p-2 mb-4"
            placeholder="https://github.com/..."
          />

          <label className="block mb-1">Demo link</label>
          <input
            type="text"
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            className="w-full border rounded p-2 mb-4"
            placeholder="https://..."
          />

          <div className="flex gap-3">
            <button type="submit" className="bg-gray-700 text-white px-4 py-2 rounded">
              Save draft
            </button>

            {submission && (
              <button
                type="button"
                onClick={handleSubmit}
                className="bg-green-700 text-white px-4 py-2 rounded"
              >
                Submit for review
              </button>
            )}
          </div>
        </form>
      ) : (
        <div>
          <p className="mb-2"><b>Summary:</b> {submission.summary}</p>
          {submission.repository_url && <p className="mb-2"><b>Repository:</b> {submission.repository_url}</p>}
          {submission.demo_url && <p className="mb-2"><b>Demo:</b> {submission.demo_url}</p>}
        </div>
      )}

      {reviews.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-bold mb-2">Mentor feedback</h3>

          {reviews.map((review) => (
            <div key={review.id} className="bg-gray-50 p-4 rounded mb-3">
              <p className="text-sm text-gray-500">
                {review.mentor_name} | {review.reviewed_at.slice(0, 10)} | {statusNames[review.decision]}
              </p>
              <p className="mt-2">{review.feedback}</p>
              <p className="text-sm text-gray-600 mt-2">
                Requirements: {review.requirement_score}/5 | Technical: {review.technical_score}/5 |
                Problem solving: {review.problem_solving_score}/5 | Documentation: {review.documentation_score}/5 |
                Communication: {review.communication_score}/5
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ParticipationCard;