import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store';
import { loadCandidatesAsync } from '../store/candidateSlice';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import CandidateList from '../components/Dashboard/CandidateList';
import CandidateDetails from '../components/Dashboard/CandidateDetails';
import SearchSortBar from '../components/Dashboard/SearchSortBar';
import { User, Calendar, Clock, TrendingUp } from 'lucide-react';

const Interviewer: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    candidates,
    selectedCandidate,
    loading,
    error
  } = useAppSelector(state => state.candidates);

  useEffect(() => {
    dispatch(loadCandidatesAsync());
  }, [dispatch]);

  const stats = {
    total: candidates.length,
    pending: candidates.filter(c => c.status === 'pending').length,
    interviewed: candidates.filter(c => c.status === 'interviewed').length,
    hired: candidates.filter(c => c.status === 'hired').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">AI Interview Assistant</h1>
              <p className="text-muted-foreground">Candidate Management Dashboard</p>
            </div>
            <Button>
              New Interview
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pending} pending applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.interviewed}</div>
              <p className="text-xs text-muted-foreground">
                Completed this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hired</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hired}</div>
              <p className="text-xs text-muted-foreground">
                Success rate: {stats.total > 0 ? Math.round((stats.hired / stats.total) * 100) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28m</div>
              <p className="text-xs text-muted-foreground">
                Per interview session
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidate List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Candidates</CardTitle>
                <SearchSortBar />
              </CardHeader>
              <CardContent>
                <CandidateList />
              </CardContent>
            </Card>
          </div>

          {/* Candidate Details */}
          <div>
            {selectedCandidate ? (
              <CandidateDetails candidate={selectedCandidate} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Select a Candidate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Choose a candidate from the list to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {error && (
          <Card className="mt-4 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Interviewer;
