
import { FaGithub } from "react-icons/fa"; // Import GitHub icon

const Header = () => {
  return (
    <header className="app-header">
      <h1 className="app-title">PDF Summarizer</h1>
      <a
        href="https://github.com/YourGitHubUsername" // Replace with your actual username
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub Profile"
        className="github-icon"
      >
        <FaGithub size={30} />
      </a>
    </header>
  );
};

export default Header;
