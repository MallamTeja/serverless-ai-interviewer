import React from 'react';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Interview Assistant</h1>
        <p>
          Welcome to the AI Interview Assistant platform.
        </p>
        <p>
          This application helps streamline the interview process with AI-powered tools.
        </p>
      </header>
      <main>
        <div className="coming-soon">
          <h2>Coming Soon</h2>
          <p>Frontend React application is under development.</p>
          <div className="api-status">
            <h3>API Status: ✅ Active</h3>
            <p>Backend server is running on port 5000</p>
            <ul>
              <li>Health Check: <code>/health</code></li>
              <li>Interview Questions: <code>/api/interview/questions</code></li>
              <li>Submit Interview: <code>/api/interview/submit</code></li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
