import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <Link to="/app/projects" className="inline-flex items-center gap-2 text-gray-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Link>
      <div className="bg-charcoal-800 rounded-xl border border-charcoal-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-4">Project Details</h1>
        <p className="text-gray-400">Project ID: {id}</p>
        <p className="text-gray-400 mt-4">Full project detail view with cost tracking, change orders, and production logs will be shown here.</p>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
