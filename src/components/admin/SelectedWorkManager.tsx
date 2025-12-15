import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, X, Upload } from 'lucide-react';
import { Project } from '../../../types';
import { getAdminProjects, createProject, updateProject, deleteProject } from '../../services/adminService';
import { uploadProjectImage } from '../../services/storageService';
import { Button, Input, Textarea, Card } from '../../../components/ui/Components';

/**
 * SelectedWorkManager Component
 * 
 * Full CRUD interface for managing projects in the selected_work table.
 * Provides create, read, update, and delete operations with real-time list updates.
 */
const SelectedWorkManager: React.FC = () => {
  // --- State Management ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- Initial Data Fetch ---
  useEffect(() => {
    loadProjects();
  }, []);

  /**
   * Fetches all projects from Supabase and updates state
   */
  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Opens the form for creating a new project
   */
  const handleNewProject = () => {
    setCurrentProject({});
    setError(null);
    setSelectedFile(null);
    setImagePreview(null);
    setIsFormOpen(true);
  };

  /**
   * Opens the form for editing an existing project
   */
  const handleEditProject = (project: Project) => {
    setCurrentProject(project);
    setError(null);
    setSelectedFile(null);
    setImagePreview(project.image_url || null);
    setIsFormOpen(true);
  };

  /**
   * Closes the form and resets state
   */
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCurrentProject({});
    setError(null);
    setSelectedFile(null);
    setImagePreview(null);
  };

  /**
   * Handles file selection for image upload
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
        setError('Image must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Handles form submission for both create and update operations
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!currentProject.title || !currentProject.description) {
      setError('Title and Description are required');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = currentProject.image_url || '';

      // Upload image if a new file is selected
      if (selectedFile) {
        setIsUploading(true);
        const uploadedUrl = await uploadProjectImage(selectedFile, currentProject.id);
        
        if (!uploadedUrl) {
          setError('Failed to upload image. Please try again.');
          setIsUploading(false);
          setIsSubmitting(false);
          return;
        }

        imageUrl = uploadedUrl;
        setIsUploading(false);
      }

      const isEdit = !!currentProject.id;
      let result: Project | null = null;

      if (isEdit) {
        // Update existing project
        result = await updateProject(currentProject.id!, {
          title: currentProject.title,
          description: currentProject.description,
          category: currentProject.category || '',
          image_url: imageUrl,
          tags: currentProject.tags || [],
        });
      } else {
        // Create new project
        result = await createProject({
          title: currentProject.title,
          description: currentProject.description,
          category: currentProject.category || '',
          image_url: imageUrl,
          tags: currentProject.tags || [],
        });
      }

      if (result) {
        // Success - reload the project list
        await loadProjects();
        handleCloseForm();
      } else {
        setError(isEdit ? 'Failed to update project' : 'Failed to create project');
      }
    } catch (err) {
      console.error('Error saving project:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  /**
   * Handles project deletion with confirmation
   */
  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await deleteProject(id);
      if (success) {
        // Success - reload the project list
        await loadProjects();
      } else {
        alert('Failed to delete project. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('An unexpected error occurred while deleting the project.');
    }
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mr-3" />
          <span className="text-slate-400">Loading projects...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Selected Work</h2>
          <p className="text-slate-400 text-sm mt-1">Manage your portfolio projects</p>
        </div>
        <Button onClick={handleNewProject}>
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      {/* Error Message */}
      {error && !isFormOpen && (
        <Card className="p-4 border-red-500/50 bg-red-500/10">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      )}

      {/* Project List */}
      {projects.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-400">No projects yet. Create your first project to get started.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map(project => (
            <Card 
              key={project.id} 
              className="p-4 flex items-center justify-between group hover:border-indigo-500/30 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-16 h-16 rounded bg-slate-800 overflow-hidden flex-shrink-0">
                  {project.image_url ? (
                    <img 
                      src={project.image_url} 
                      alt={project.title}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white truncate">{project.title}</h4>
                  <div className="text-xs text-slate-500 mt-1">
                    {project.category} • {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.tags.slice(0, 3).map((tag, idx) => (
                        <span 
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded border border-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="text-xs text-slate-500">+{project.tags.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                <Button 
                  variant="secondary" 
                  className="h-8 w-8 p-0" 
                  onClick={() => handleEditProject(project)}
                  title="Edit project"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="danger" 
                  className="h-8 w-8 p-0" 
                  onClick={() => handleDeleteProject(project.id)}
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-indigo-500/50">
            <div className="p-6 space-y-4">
              {/* Form Header */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">
                  {currentProject.id ? 'Edit Project' : 'Create New Project'}
                </h3>
                <button
                  onClick={handleCloseForm}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                  disabled={isSubmitting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Title *"
                    value={currentProject.title || ''}
                    onChange={e => setCurrentProject({ ...currentProject, title: e.target.value })}
                    placeholder="Project Title"
                    required
                    disabled={isSubmitting}
                  />
                  <Input
                    label="Category"
                    value={currentProject.category || ''}
                    onChange={e => setCurrentProject({ ...currentProject, category: e.target.value })}
                    placeholder="e.g., Product, Creative Work"
                    disabled={isSubmitting}
                  />
                </div>

                <Textarea
                  label="Description *"
                  value={currentProject.description || ''}
                  onChange={e => setCurrentProject({ ...currentProject, description: e.target.value })}
                  placeholder="Describe your project..."
                  className="min-h-[120px]"
                  required
                  disabled={isSubmitting}
                />

                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Project Image</label>
                  <div className="flex flex-col gap-3">
                    {/* File Input */}
                    <div className="flex items-center gap-3">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={isSubmitting || isUploading}
                        />
                        <div className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-700 rounded-md bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:border-indigo-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">
                            {selectedFile ? selectedFile.name : 'Choose Image File'}
                          </span>
                        </div>
                      </label>
                    </div>
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative w-full h-48 rounded-md overflow-hidden border border-slate-700 bg-slate-900/50">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    
                    {/* Help Text */}
                    <p className="text-xs text-slate-500">
                      Upload an image file (JPG, PNG, etc.) or leave empty. Max size: 5MB
                    </p>
                  </div>
                </div>

                <Input
                  label="Tags (comma separated)"
                  placeholder="React, Next.js, Design"
                  value={currentProject.tags?.join(', ') || ''}
                  onChange={e => {
                    const tags = e.target.value
                      .split(',')
                      .map(s => s.trim())
                      .filter(s => s.length > 0);
                    setCurrentProject({ ...currentProject, tags });
                  }}
                  disabled={isSubmitting}
                />

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCloseForm}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isUploading || !currentProject.title || !currentProject.description}
                  >
                    {(isSubmitting || isUploading) ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isUploading ? 'Uploading...' : (currentProject.id ? 'Updating...' : 'Creating...')}
                      </>
                    ) : (
                      currentProject.id ? 'Update Project' : 'Create Project'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SelectedWorkManager;

