import { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

const AdminPage = () => {
  const [prompt, setPrompt] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch the current prompt
    fetch(import.meta.env.DEV ? 'http://127.0.0.1:5001/aiguessr-vf/europe-west1/getPrompt' : "https://getprompt-zfgfpmp7fq-ew.a.run.app")
      .then((response) => response.json())
      .then((data) => setPrompt(data.prompt))
      .catch((error) => console.error('Error fetching prompt:', error));
  }, []);

  const handleUpdatePrompt = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    fetch(import.meta.env.DEV ? 'http://127.0.0.1:5001/aiguessr-vf/europe-west1/updatePrompt' : "https://updateprompt-zfgfpmp7fq-ew.a.run.app", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }, 
      body: JSON.stringify({ newPrompt }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          setMessage('Prompt updated successfully!');
          setPrompt(newPrompt);
          setNewPrompt('');
        }
      })
      .catch((error) => {
        console.error('Error updating prompt:', error);
        setMessage('Failed to update prompt.');
      });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h1>Admin Page: Edit ChatGPT Prompt</h1>
      <h3>Current Prompt:</h3>
      <p style={{ whiteSpace: 'pre-wrap', border: '1px solid #ccc', padding: '10px' }}>
        {prompt || <LoadingScreen isFull={true} />}
      </p>
      <form onSubmit={handleUpdatePrompt}>
        <textarea
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
          rows={10}
          style={{ width: '100%', marginTop: '10px', padding: '10px' }}
          placeholder="Enter the new prompt here..."
        ></textarea>
        <button type="submit" style={{ marginTop: '10px' }}>
          Update Prompt
        </button>
      </form>
      {message && <p style={{ marginTop: '10px', color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}
    </div>
  );
};

export default AdminPage;
