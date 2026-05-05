import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import NavBar from './components/NavBar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetails from './pages/MovieDetails';
import ActorDetails from './pages/ActorDetails';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Parties from './pages/Parties';
import Lists from './pages/Lists';
import Subscription from './pages/Subscription';
import InfoPage from './pages/InfoPage';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import WriteArticle from './pages/WriteArticle';
import Friends from './pages/Friends';
import Members from './pages/Members';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col relative bg-surface font-mono text-ink">
          <NavBar />
          <main className="flex-1 p-8 md:p-12 container mx-auto max-w-7xl">
            <ErrorBoundary>
              <Routes>
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/*" element={<Navigate to="/admin/login" />} />
                
                <Route path="/" element={<Home />} />
                <Route path="/movies" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/movie/:id" element={<MovieDetails />} />
                <Route path="/person/:id" element={<ActorDetails />} />
                <Route path="/search" element={<Search />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/parties" element={<Parties />} />
                <Route path="/lists" element={<Lists />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/members" element={<Members />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/about" element={<InfoPage page="about" />} />
                <Route path="/contact" element={<InfoPage page="contact" />} />
                <Route path="/terms" element={<InfoPage page="terms" />} />
                <Route path="/privacy" element={<InfoPage page="privacy" />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/articles/:slug" element={<ArticleDetail />} />
                <Route path="/write" element={<WriteArticle />} />
                <Route path="*" element={<InfoPage />} />
              </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
