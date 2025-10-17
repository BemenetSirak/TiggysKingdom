import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Lessons from "./pages/Lessons";
import About from "./pages/About";

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-100 text-gray-800">
        
        {/* Navbar */}
        <nav className="bg-blue-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">MyEduSite</h1>
            <div className="space-x-6">
              <Link to="/" className="hover:text-gray-200">Home</Link>
              <Link to="/lessons" className="hover:text-gray-200">Lessons</Link>
              <Link to="/about" className="hover:text-gray-200">About</Link>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="flex-grow container mx-auto p-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white text-center p-4">
          © {new Date().getFullYear()} My Educational Website
        </footer>

      </div>
    </Router>
  );
}

export default App;
