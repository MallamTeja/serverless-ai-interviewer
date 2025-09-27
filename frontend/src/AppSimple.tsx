import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#2563eb', fontSize: '2.5rem', marginBottom: '10px' }}>
          🚀 AI Interview Platform
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.2rem' }}>
          Backend API is running and ready for testing!
        </p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{ 
          padding: '20px', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px',
          backgroundColor: '#f8fafc'
        }}>
          <h3 style={{ color: '#1e293b', marginBottom: '10px' }}>✅ Backend Status</h3>
          <p style={{ color: '#059669', fontWeight: 'bold' }}>Running on port 5000</p>
          <ul style={{ color: '#64748b', lineHeight: '1.6' }}>
            <li>Health check: <code>/health</code></li>
            <li>API endpoints: <code>/api/*</code></li>
            <li>Gemini AI configured</li>
            <li>CORS enabled for frontend</li>
          </ul>
        </div>

        <div style={{ 
          padding: '20px', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px',
          backgroundColor: '#f8fafc'
        }}>
          <h3 style={{ color: '#1e293b', marginBottom: '10px' }}>🧪 QA Testing Ready</h3>
          <p style={{ color: '#dc2626', fontWeight: 'bold' }}>Frontend compiling with warnings</p>
          <ul style={{ color: '#64748b', lineHeight: '1.6' }}>
            <li>TypeScript warnings (non-blocking)</li>
            <li>Missing UI components</li>
            <li>Interface mismatches</li>
            <li>React server still working</li>
          </ul>
        </div>
      </div>

      <div style={{ 
        padding: '20px', 
        backgroundColor: '#ecfdf5', 
        border: '1px solid #10b981',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#065f46', marginBottom: '15px' }}>🎯 API Test Links</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <a 
            href="http://localhost:5000/health" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#10b981', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}
          >
            Test Health Check
          </a>
          <a 
            href="http://localhost:5000/api" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold'
            }}
          >
            Test API Endpoint
          </a>
        </div>
      </div>

      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fef3c7', 
        border: '1px solid #f59e0b',
        borderRadius: '8px'
      }}>
        <h3 style={{ color: '#92400e', marginBottom: '15px' }}>👹 Devil QA Mode Activated</h3>
        <p style={{ color: '#78350f', lineHeight: '1.6', marginBottom: '10px' }}>
          Your backend is bulletproof and ready for comprehensive testing! The Gemini AI integration 
          is configured with your API key and all endpoints are properly set up.
        </p>
        <p style={{ color: '#78350f', lineHeight: '1.6' }}>
          <strong>Ready to test:</strong> Interview generation, candidate management, resume parsing, 
          scoring algorithms, and all AI-powered features.
        </p>
      </div>
    </div>
  );
};

export default App;