import express, { Request, Response, NextFunction } from 'express';
const router = express.Router();

// Async error handler wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Interview endpoints
router.post('/interview/submit', asyncHandler(async (req: Request, res: Response) => {
  const { candidateId, answers, sessionId } = req.body;

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock scoring and feedback
  const mockResponse = {
    success: true,
    data: {
      sessionId: sessionId || `session_${Date.now()}`,
      candidateId: candidateId || `candidate_${Date.now()}`,
      overallScore: Math.floor(Math.random() * 40) + 60, // 60-100
      breakdown: {
        technicalSkills: Math.floor(Math.random() * 30) + 70,
        communication: Math.floor(Math.random() * 25) + 75,
        problemSolving: Math.floor(Math.random() * 35) + 65,
        culturalFit: Math.floor(Math.random() * 20) + 80,
      },
      feedback: {
        strengths: [
          "Strong technical foundation in core concepts",
          "Clear communication and articulation",
          "Good problem-solving approach"
        ],
        improvements: [
          "Could benefit from more specific examples",
          "Consider exploring edge cases more thoroughly"
        ],
        recommendations: "Solid candidate with good potential for growth"
      },
      answeredQuestions: answers?.length || 0,
      duration: Math.floor(Math.random() * 20) + 15, // 15-35 minutes
      completedAt: new Date().toISOString(),
    }
  };

  res.status(200).json(mockResponse);
}));

router.get('/interview/questions', asyncHandler(async (req: Request, res: Response) => {
  const { role, level, count = 5 } = req.query;

  const mockQuestions = [
    {
      id: "q1",
      type: "technical",
      category: "programming",
      difficulty: "medium",
      question: "Explain the difference between synchronous and asynchronous programming. Provide examples.",
      expectedDuration: 3,
    },
    {
      id: "q2",
      type: "behavioral",
      category: "teamwork",
      difficulty: "easy",
      question: "Describe a time when you had to work with a difficult team member. How did you handle it?",
      expectedDuration: 4,
    },
    {
      id: "q3",
      type: "technical",
      category: "problem-solving",
      difficulty: "hard",
      question: "How would you design a system to handle 1 million concurrent users?",
      expectedDuration: 8,
    },
    {
      id: "q4",
      type: "technical",
      category: "algorithms",
      difficulty: "medium",
      question: "Implement a function to find the longest palindromic substring in a given string.",
      expectedDuration: 10,
    },
    {
      id: "q5",
      type: "behavioral",
      category: "leadership",
      difficulty: "medium",
      question: "Tell me about a project you led. What challenges did you face and how did you overcome them?",
      expectedDuration: 5,
    }
  ];

  const response = {
    success: true,
    data: {
      questions: mockQuestions.slice(0, Number(count)),
      metadata: {
        role: role || "software-engineer",
        level: level || "mid",
        totalQuestions: Number(count),
        estimatedDuration: mockQuestions.slice(0, Number(count))
          .reduce((sum, q) => sum + q.expectedDuration, 0),
      }
    }
  };

  res.status(200).json(response);
}));

// Resume endpoints
router.post('/resume/upload', asyncHandler(async (req: Request, res: Response) => {
  const { fileName, fileContent, fileType } = req.body;

  if (!fileName || !fileContent) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: fileName and fileContent',
      error: {
        code: 'MISSING_FIELDS',
        fields: ['fileName', 'fileContent']
      }
    });
  }

  // Simulate file processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  const mockParsedData = {
    success: true,
    data: {
      uploadId: `upload_${Date.now()}`,
      fileName,
      fileType: fileType || 'application/pdf',
      parsedContent: {
        personalInfo: {
          name: "John Doe",
          email: "john.doe@email.com",
          phone: "+1 (555) 123-4567",
          location: "San Francisco, CA"
        },
        summary: "Experienced software engineer with 5+ years in full-stack development",
        experience: [
          {
            company: "Tech Corp",
            position: "Senior Software Engineer",
            duration: "2021 - Present",
            description: "Led development of microservices architecture serving 10M+ users"
          },
          {
            company: "StartupXYZ",
            position: "Full Stack Developer",
            duration: "2019 - 2021",
            description: "Built and maintained React/Node.js applications"
          }
        ],
        skills: {
          technical: ["JavaScript", "TypeScript", "React", "Node.js", "Python", "AWS"],
          soft: ["Leadership", "Communication", "Problem Solving", "Team Collaboration"]
        },
        education: [
          {
            institution: "University of Technology",
            degree: "Bachelor of Computer Science",
            year: "2019"
          }
        ]
      },
      analysis: {
        experienceLevel: "senior",
        matchScore: Math.floor(Math.random() * 30) + 70, // 70-100
        keyStrengths: ["Full-stack development", "Team leadership", "Modern tech stack"],
        potentialGaps: ["Cloud architecture", "DevOps practices"]
      },
      processedAt: new Date().toISOString(),
    }
  };

  res.status(201).json(mockParsedData);
}));

router.get('/resume/parse/:uploadId', asyncHandler(async (req: Request, res: Response) => {
  const { uploadId } = req.params;

  if (!uploadId) {
    return res.status(400).json({
      success: false,
      message: 'Upload ID is required',
      error: { code: 'MISSING_UPLOAD_ID' }
    });
  }

  // Simulate retrieval
  const mockData = {
    success: true,
    data: {
      uploadId,
      status: 'completed',
      parsedAt: new Date().toISOString(),
      content: {
        // Similar structure as above but for retrieval
        personalInfo: {
          name: "Jane Smith",
          email: "jane.smith@email.com",
          phone: "+1 (555) 987-6543"
        },
        summary: "Frontend specialist with React expertise"
      }
    }
  };

  res.status(200).json(mockData);
}));

// Candidates endpoints
router.get('/candidates', asyncHandler(async (req: Request, res: Response) => {
  const { 
    page = 1, 
    limit = 10, 
    sortBy = 'createdAt', 
    sortOrder = 'desc',
    search,
    status,
    minScore,
    maxScore 
  } = req.query;

  const mockCandidates = Array.from({ length: 25 }, (_, i) => ({
    id: `candidate_${i + 1}`,
    name: `Candidate ${i + 1}`,
    email: `candidate${i + 1}@email.com`,
    phone: `+1 (555) ${String(i + 100).padStart(3, '0')}-${String((i + 1) * 1000).slice(-4)}`,
    position: ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer'][i % 4],
    status: ['pending', 'interviewed', 'hired', 'rejected'][i % 4],
    overallScore: Math.floor(Math.random() * 40) + 60,
    resumeId: `resume_${i + 1}`,
    interviewId: i % 3 === 0 ? `interview_${i + 1}` : null,
    appliedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'].slice(0, (i % 4) + 1),
    experience: ['junior', 'mid', 'senior'][i % 3],
  }));

  // Apply filters
  let filteredCandidates = mockCandidates;

  if (search) {
    const searchTerm = String(search).toLowerCase();
    filteredCandidates = filteredCandidates.filter(candidate =>
      candidate.name.toLowerCase().includes(searchTerm) ||
      candidate.email.toLowerCase().includes(searchTerm) ||
      candidate.position.toLowerCase().includes(searchTerm)
    );
  }

  if (status) {
    filteredCandidates = filteredCandidates.filter(candidate => candidate.status === status);
  }

  if (minScore) {
    filteredCandidates = filteredCandidates.filter(candidate => candidate.overallScore >= Number(minScore));
  }

  if (maxScore) {
    filteredCandidates = filteredCandidates.filter(candidate => candidate.overallScore <= Number(maxScore));
  }

  // Apply sorting
  filteredCandidates.sort((a: any, b: any) => {
    const aVal = a[String(sortBy)];
    const bVal = b[String(sortBy)];
    const modifier = sortOrder === 'desc' ? -1 : 1;
    
    if (aVal < bVal) return -1 * modifier;
    if (aVal > bVal) return 1 * modifier;
    return 0;
  });

  // Apply pagination
  const startIndex = (Number(page) - 1) * Number(limit);
  const paginatedCandidates = filteredCandidates.slice(startIndex, startIndex + Number(limit));

  const response = {
    success: true,
    data: {
      candidates: paginatedCandidates,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(filteredCandidates.length / Number(limit)),
        totalItems: filteredCandidates.length,
        itemsPerPage: Number(limit),
        hasNext: startIndex + Number(limit) < filteredCandidates.length,
        hasPrev: Number(page) > 1,
      },
      filters: {
        search: search || null,
        status: status || null,
        minScore: minScore ? Number(minScore) : null,
        maxScore: maxScore ? Number(maxScore) : null,
      },
      sort: {
        sortBy: String(sortBy),
        sortOrder: String(sortOrder),
      }
    }
  };

  res.status(200).json(response);
}));

router.get('/candidates/:candidateId', asyncHandler(async (req: Request, res: Response) => {
  const { candidateId } = req.params;

  if (!candidateId) {
    return res.status(400).json({
      success: false,
      message: 'Candidate ID is required',
      error: { code: 'MISSING_CANDIDATE_ID' }
    });
  }

  const mockCandidate = {
    success: true,
    data: {
      id: candidateId,
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "+1 (555) 123-4567",
      position: "Senior Software Engineer",
      status: "interviewed",
      overallScore: 87,
      scoreBreakdown: {
        technicalSkills: 90,
        communication: 85,
        problemSolving: 88,
        culturalFit: 85,
      },
      resumeData: {
        uploadId: `resume_${candidateId}`,
        fileName: "john_doe_resume.pdf",
        parsedContent: {
          experience: "5+ years in full-stack development",
          skills: ["JavaScript", "TypeScript", "React", "Node.js", "AWS"],
          education: "BS Computer Science"
        }
      },
      interviewData: {
        sessionId: `session_${candidateId}`,
        completedAt: "2025-01-15T10:30:00Z",
        duration: 45,
        questionsAnswered: 8,
        feedback: {
          strengths: ["Strong technical foundation", "Excellent communication"],
          improvements: ["Could provide more specific examples"],
        }
      },
      timeline: [
        {
          event: "Application submitted",
          timestamp: "2025-01-10T09:00:00Z",
          description: "Resume uploaded and parsed successfully"
        },
        {
          event: "Interview scheduled",
          timestamp: "2025-01-12T14:00:00Z",
          description: "Interview scheduled for January 15th"
        },
        {
          event: "Interview completed",
          timestamp: "2025-01-15T10:30:00Z",
          description: "Technical interview completed with score: 87/100"
        }
      ],
      appliedAt: "2025-01-10T09:00:00Z",
      lastUpdated: "2025-01-15T11:00:00Z",
    }
  };

  res.status(200).json(mockCandidate);
}));

router.patch('/candidates/:candidateId/status', asyncHandler(async (req: Request, res: Response) => {
  const { candidateId } = req.params;
  const { status, notes } = req.body;

  if (!candidateId) {
    return res.status(400).json({
      success: false,
      message: 'Candidate ID is required',
      error: { code: 'MISSING_CANDIDATE_ID' }
    });
  }

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required',
      error: { code: 'MISSING_STATUS' }
    });
  }

  const validStatuses = ['pending', 'interviewed', 'hired', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
      error: { code: 'INVALID_STATUS' }
    });
  }

  const response = {
    success: true,
    data: {
      candidateId,
      previousStatus: 'interviewed',
      newStatus: status,
      notes: notes || null,
      updatedAt: new Date().toISOString(),
      updatedBy: 'current_user', // In real app, would come from auth
    }
  };

  res.status(200).json(response);
}));

// API info endpoint
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'AI Interview Assistant API',
    version: '1.0.0',
    endpoints: {
      interview: {
        'POST /api/interview/submit': 'Submit interview responses',
        'GET /api/interview/questions': 'Get interview questions',
      },
      resume: {
        'POST /api/resume/upload': 'Upload and parse resume',
        'GET /api/resume/parse/:uploadId': 'Get parsed resume data',
      },
      candidates: {
        'GET /api/candidates': 'List all candidates with filtering/pagination',
        'GET /api/candidates/:candidateId': 'Get specific candidate details',
        'PATCH /api/candidates/:candidateId/status': 'Update candidate status',
      }
    }
  });
});

export default router;