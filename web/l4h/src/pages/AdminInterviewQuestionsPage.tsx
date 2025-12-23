import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Modal, Input, useToast } from '@l4h/shared-ui';

interface QuestionOption {
  id?: string;
  value: string;
  label: string;
  displayOrder: number;
  isActive: boolean;
  icon?: string;
  description?: string;
}

interface InterviewQuestion {
  id: string;
  key: string;
  text: string;
  category: string;
  inputType: string;
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
  description?: string;
  discriminatesVisaCodes?: string;
  selectionWeight: number;
  parentId?: string;
  pageConfig?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserEmail?: string;
  updatedByUserEmail?: string;
  options: QuestionOption[];
}

interface QuestionFormData {
  key: string;
  text: string;
  category: string;
  inputType: string;
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
  description: string;
  discriminatesVisaCodes: string;
  selectionWeight: number;
  parentId: string | null;
  pageConfig: string;
  options: QuestionOption[];
}

const CATEGORIES = [
  { value: 'critical', label: 'Critical (Always First)' },
  { value: 'work', label: 'Work/Employment' },
  { value: 'family', label: 'Family' },
  { value: 'education', label: 'Education' },
  { value: 'tourism', label: 'Tourism' },
  { value: 'business', label: 'Business' },
  { value: 'citizenship', label: 'Citizenship' },
  { value: 'adoption', label: 'Adoption' },
  { value: 'refinement', label: 'Refinement' }
];

const INPUT_TYPES = [
  { value: 'select', label: 'Dropdown Select' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'document_upload', label: 'Document Upload' },
  { value: 'attorney_question', label: 'Attorney Question Page' }
];

export default function AdminInterviewQuestionsPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<InterviewQuestion | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<{id?: string, value: string, label: string, displayOrder: number, isActive: boolean}[]>([]);
  const [modalKey, setModalKey] = useState(0);

  const [formData, setFormData] = useState<QuestionFormData>({
    key: '',
    text: '',
    category: 'critical',
    inputType: 'select',
    displayOrder: 0,
    isRequired: true,
    isActive: true,
    description: '',
    discriminatesVisaCodes: '',
    selectionWeight: 50,
    parentId: null,
    pageConfig: '',
    options: []
  });

  useEffect(() => {
    loadQuestions();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch('/api/v1/admin/interview-categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setCategories(data);
        } else {
          // Fallback to defaults if none in DB yet
          setCategories(CATEGORIES.map((c, i) => ({ ...c, displayOrder: i, isActive: true })));
        }
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  // Sync formData when editing a question - use id as dependency to ensure it triggers
  // Also clear formData AND editingQuestion when modal closes to prevent stale data
  useEffect(() => {
    console.log('[useEffect] Triggered - showModal:', showModal);
    if (!showModal) {
      // Clear both formData AND editingQuestion when modal closes
      console.log('[useEffect] Modal closed - clearing formData and editingQuestion');
      setFormData({
        key: '',
        text: '',
        category: 'critical', // Default to critical instead of empty to avoid validation errors
        inputType: 'select',
        displayOrder: 1,
        isRequired: false,
        isActive: true,
        description: '',
        discriminatesVisaCodes: '',
        selectionWeight: 100,
        parentId: null,
        pageConfig: '',
        options: []
      });
      setEditingQuestion(null);
    }
  }, [showModal]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwt_token');
      const response = await fetch('/api/v1/admin/interview-questions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load questions');
      }

      const data = await response.json();
      setQuestions(data);
    } catch (err: any) {
      error('Failed to load questions', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate a key from question text
  const generateKeyFromText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit to 50 characters
  };

  const openCreateModal = () => {
    setModalKey(prev => prev + 1);
    setEditingQuestion(null);
    setFormData({
      key: '',
      text: '',
      category: 'critical',
      inputType: 'select',
      displayOrder: questions.length,
      isRequired: true,
      isActive: true,
      description: '',
      discriminatesVisaCodes: '',
      selectionWeight: 50,
      parentId: null,
      pageConfig: '',
      options: []
    });
    setShowModal(true);
  };

  const openEditModal = (question: InterviewQuestion) => {
    console.log('[openEditModal] Called with question:', question.key, 'inputType:', question.inputType);
    // Set question data first
    setEditingQuestion(question);
    setFormData({
      key: question.key,
      text: question.text,
      category: question.category,
      inputType: question.inputType,
      displayOrder: question.displayOrder,
      isRequired: question.isRequired,
      isActive: question.isActive,
      description: question.description || '',
      discriminatesVisaCodes: question.discriminatesVisaCodes || '',
      selectionWeight: question.selectionWeight,
      parentId: question.parentId || null,
      pageConfig: question.pageConfig || '',
      options: question.options.map(o => ({ ...o }))
    });

    // Small delay to ensure state updates have propagated before showing modal
    setTimeout(() => {
      setShowModal(true);
    }, 50);
  };

  const openCreateChildModal = (parentQuestion: InterviewQuestion) => {
    setEditingQuestion(null);
    setFormData({
      key: '',
      text: '',
      category: parentQuestion.category, // Inherit category
      inputType: 'select',
      displayOrder: questions.length,
      isRequired: true,
      isActive: true,
      description: '',
      discriminatesVisaCodes: parentQuestion.discriminatesVisaCodes || '', // Inherit discrimination codes
      selectionWeight: parentQuestion.selectionWeight, // Inherit weight
      parentId: parentQuestion.id, // Set parent
      pageConfig: '',
      options: []
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('jwt_token');
      const url = editingQuestion
        ? `/api/v1/admin/interview-questions/${editingQuestion.id}`
        : '/api/v1/admin/interview-questions';

      const method = editingQuestion ? 'PUT' : 'POST';

      // Format options properly for backend
      const formattedOptions = formData.options.map(opt => ({
        id: opt.id || null, // Backend expects 'id' (lowercase) as Guid? or null
        value: opt.value,
        label: opt.label,
        displayOrder: opt.displayOrder,
        isActive: opt.isActive,
        icon: opt.icon || null,
        description: opt.description || null
      }));

      // Create proper request payload
      const payload = {
        key: formData.key,
        text: formData.text,
        category: formData.category,
        inputType: formData.inputType,
        displayOrder: formData.displayOrder,
        isRequired: formData.isRequired,
        isActive: formData.isActive,
        description: formData.description || null,
        discriminatesVisaCodes: formData.discriminatesVisaCodes || null,
        selectionWeight: formData.selectionWeight,
        parentId: formData.parentId || null,
        pageConfig: formData.pageConfig || null,
        options: formattedOptions
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('=== API ERROR RESPONSE ===');
        console.error('Status:', response.status);
        console.error('Status Text:', response.statusText);
        console.error('Response body:', errorText);
        console.error('Request payload was:', payload);
        console.error('========================');

        let errorMessage = 'Failed to save question';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorData.title || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      success(editingQuestion ? 'Question updated successfully' : 'Question created successfully');
      setShowModal(false);
      loadQuestions();
    } catch (err: any) {
      error('Failed to save question', err.message);
    }
  };

  const handleDelete = async () => {
    if (!questionToDelete) return;

    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`/api/v1/admin/interview-questions/${questionToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete question');
      }

      success('Question deleted successfully');
      setShowDeleteConfirm(false);
      setQuestionToDelete(null);
      loadQuestions();
    } catch (err: any) {
      error('Failed to delete question', err.message);
    }
  };

  const moveQuestionUp = async (question: InterviewQuestion) => {
    const currentIndex = filteredQuestions.findIndex(q => q.id === question.id);
    if (currentIndex <= 0) return;

    const newQuestions = [...filteredQuestions];
    const temp = newQuestions[currentIndex - 1].displayOrder;
    newQuestions[currentIndex - 1].displayOrder = question.displayOrder;
    newQuestions[currentIndex].displayOrder = temp;

    await reorderQuestions([
      { questionId: newQuestions[currentIndex - 1].id, displayOrder: newQuestions[currentIndex - 1].displayOrder },
      { questionId: newQuestions[currentIndex].id, displayOrder: newQuestions[currentIndex].displayOrder }
    ]);
  };

  const moveQuestionDown = async (question: InterviewQuestion) => {
    const currentIndex = filteredQuestions.findIndex(q => q.id === question.id);
    if (currentIndex >= filteredQuestions.length - 1) return;

    const newQuestions = [...filteredQuestions];
    const temp = newQuestions[currentIndex + 1].displayOrder;
    newQuestions[currentIndex + 1].displayOrder = question.displayOrder;
    newQuestions[currentIndex].displayOrder = temp;

    await reorderQuestions([
      { questionId: newQuestions[currentIndex].id, displayOrder: newQuestions[currentIndex].displayOrder },
      { questionId: newQuestions[currentIndex + 1].id, displayOrder: newQuestions[currentIndex + 1].displayOrder }
    ]);
  };

  const reorderQuestions = async (updates: { questionId: string; displayOrder: number }[]) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch('/api/v1/admin/interview-questions/reorder', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ questions: updates })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder questions');
      }

      success('Questions reordered successfully');
      loadQuestions();
    } catch (err: any) {
      error('Failed to reorder questions', err.message);
    }
  };

  const toggleActive = async (question: InterviewQuestion) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch(`/api/v1/admin/interview-questions/${question.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...question,
          isActive: !question.isActive
        })
      });

      if (!response.ok) {
        throw new Error('Failed to toggle question status');
      }

      success(`Question ${!question.isActive ? 'activated' : 'deactivated'} successfully`);
      loadQuestions();
    } catch (err: any) {
      error('Failed to toggle question status', err.message);
    }
  };

  const toggleExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        {
          value: '',
          label: '',
          displayOrder: formData.options.length,
          isActive: true
        }
      ]
    });
  };

  const updateOption = (index: number, field: keyof QuestionOption, value: any) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const addCategory = () => {
    const newValue = `category_${categories.length + 1}`;
    setCategories([...categories, { value: newValue, label: 'New Category', displayOrder: categories.length, isActive: true }]);
  };

  const updateCategory = (index: number, field: string, value: string | number | boolean) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setCategories(newCategories);
  };

  const removeCategory = (index: number) => {
    const newCategories = categories.filter((_, i) => i !== index);
    setCategories(newCategories);
  };

  const saveCategoryChanges = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      
      // For each category, create or update
      for (const cat of categories) {
        const method = cat.id ? 'PUT' : 'POST';
        const url = cat.id ? `/api/v1/admin/interview-categories/${cat.id}` : '/api/v1/admin/interview-categories';
        
        await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cat)
        });
      }
      
      success('Category changes saved successfully');
      setShowCategoryModal(false);
      loadCategories();
    } catch (err) {
      error('Failed to save categories');
    }
  };

  const filteredQuestions = questions.filter(question => {
    // Category filter
    if (selectedCategory !== 'all' && question.category !== selectedCategory) return false;

    // Status filter
    if (selectedStatus === 'active' && !question.isActive) return false;
    if (selectedStatus === 'inactive' && question.isActive) return false;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        question.key.toLowerCase().includes(searchLower) ||
        question.text.toLowerCase().includes(searchLower) ||
        question.description?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Build hierarchical structure for display
  interface HierarchicalQuestion extends InterviewQuestion {
    level: number;
    children: HierarchicalQuestion[];
  }

  const buildHierarchy = (questions: InterviewQuestion[]): HierarchicalQuestion[] => {
    const questionMap = new Map<string, HierarchicalQuestion>();
    const rootQuestions: HierarchicalQuestion[] = [];

    // First pass: create map of all questions with level and empty children
    questions.forEach(q => {
      questionMap.set(q.id, { ...q, level: 0, children: [] });
    });

    // Second pass: build parent-child relationships and calculate levels
    questions.forEach(q => {
      const question = questionMap.get(q.id)!;
      if (q.parentId) {
        const parent = questionMap.get(q.parentId);
        if (parent) {
          question.level = parent.level + 1;
          parent.children.push(question);
        } else {
          // Parent not found (maybe filtered out), treat as root
          rootQuestions.push(question);
        }
      } else {
        rootQuestions.push(question);
      }
    });

    // Flatten hierarchy for display (depth-first)
    const flattenHierarchy = (questions: HierarchicalQuestion[]): HierarchicalQuestion[] => {
      const result: HierarchicalQuestion[] = [];
      questions.forEach(q => {
        result.push(q);
        if (q.children.length > 0) {
          result.push(...flattenHierarchy(q.children));
        }
      });
      return result;
    };

    return flattenHierarchy(rootQuestions);
  };

  const hierarchicalQuestions = buildHierarchy(filteredQuestions);

  const categoryStats = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = questions.filter(q => q.category === cat.value).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Interview Questions Management</h1>
              <p className="text-gray-600">
                Manage interview questions shown to customers. Changes take effect immediately.
              </p>
            </div>
            <Button onClick={openCreateModal}>Add New Question</Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="px-4 py-5">
            <div className="text-sm font-medium text-gray-500">Total Questions</div>
            <div className="mt-1 text-3xl font-semibold text-gray-900">{questions.length}</div>
          </div>
        </Card>
        <Card>
          <div className="px-4 py-5">
            <div className="text-sm font-medium text-gray-500">Active</div>
            <div className="mt-1 text-3xl font-semibold text-green-600">
              {questions.filter(q => q.isActive).length}
            </div>
          </div>
        </Card>
        <Card>
          <div className="px-4 py-5">
            <div className="text-sm font-medium text-gray-500">Inactive</div>
            <div className="mt-1 text-3xl font-semibold text-gray-400">
              {questions.filter(q => !q.isActive).length}
            </div>
          </div>
        </Card>
        <Card>
          <div className="px-4 py-5">
            <div className="text-sm font-medium text-gray-500">Critical</div>
            <div className="mt-1 text-3xl font-semibold text-red-600">
              {categoryStats.critical || 0}
            </div>
          </div>
        </Card>
        <Card>
          <div className="px-4 py-5">
            <div className="text-sm font-medium text-gray-500">Total Options</div>
            <div className="mt-1 text-3xl font-semibold text-blue-600">
              {questions.reduce((sum, q) => sum + q.options.length, 0)}
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Filter by Category
                </label>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Edit Categories
                </button>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} ({categoryStats[cat.value] || 0})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <Input
                type="text"
                placeholder="Search by key, text, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Questions List */}
      <Card>
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            {hierarchicalQuestions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No questions found
              </div>
            ) : (
              hierarchicalQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  style={{ marginLeft: `${question.level * 40}px` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        {question.level > 0 && (
                          <div className="text-gray-400 text-sm">
                            └─
                          </div>
                        )}
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium text-gray-500">
                            #{question.displayOrder}
                          </span>
                          <div className="flex flex-col mt-1">
                            <button
                              onClick={() => moveQuestionUp(question)}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveQuestionDown(question)}
                              disabled={index === hierarchicalQuestions.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                            >
                              ▼
                            </button>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <code className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {question.key}
                            </code>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              {question.category}
                            </span>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {question.inputType}
                            </span>
                            {question.isRequired && (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-gray-900 font-medium">{question.text}</p>
                          {question.description && (
                            <p className="mt-1 text-sm text-gray-500">{question.description}</p>
                          )}
                          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                            <span>{question.options.length} options</span>
                            {question.discriminatesVisaCodes && (
                              <span>Visas: {question.discriminatesVisaCodes}</span>
                            )}
                            <span>Weight: {question.selectionWeight}</span>
                          </div>
                        </div>
                      </div>

                      {/* Options (collapsible) */}
                      {question.options.length > 0 && (
                        <div className="mt-3 ml-12">
                          <button
                            onClick={() => toggleExpanded(question.id)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {expandedQuestions.has(question.id) ? '▼ Hide' : '▶ Show'} {question.options.length} Options
                          </button>
                          {expandedQuestions.has(question.id) && (
                            <div className="mt-2 space-y-1">
                              {question.options.map((option, idx) => (
                                <div
                                  key={option.id || idx}
                                  className="flex items-center space-x-2 text-sm bg-gray-50 px-3 py-2 rounded"
                                >
                                  <span className="text-gray-500">#{option.displayOrder}</span>
                                  <code className="text-blue-600">{option.value}</code>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-gray-900">{option.label}</span>
                                  {!option.isActive && (
                                    <span className="text-xs text-red-500">(inactive)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <button
                        onClick={() => toggleActive(question)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          question.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {question.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <div className="flex flex-col space-y-1">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(question)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setQuestionToDelete(question);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                        <button
                          onClick={() => openCreateChildModal(question)}
                          className="text-green-600 hover:text-green-900 text-xs font-medium text-left"
                        >
                          + Add Child
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingQuestion ? 'Edit Interview Question' : 'Create Interview Question'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Text *
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => {
                const newText = e.target.value;
                setFormData({
                  ...formData,
                  text: newText,
                  // Auto-generate key only for new questions
                  key: editingQuestion ? formData.key : generateKeyFromText(newText)
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              required
              placeholder="Enter the question text shown to users"
            />
            {formData.key && (
              <p className="mt-1 text-xs text-gray-500">
                Generated key: <code className="bg-gray-100 px-1 py-0.5 rounded">{formData.key}</code>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Question (optional)
              </label>
              <select
                value={formData.parentId || ''}
                onChange={(e) => {
                  const newParentId = e.target.value || null;
                  const parentQuestion = questions.find(q => q.id === newParentId);

                  // Inherit discrimination codes from parent
                  setFormData({
                    ...formData,
                    parentId: newParentId,
                    discriminatesVisaCodes: parentQuestion?.discriminatesVisaCodes || ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None (Top-level question)</option>
                {questions
                  .filter(q => !editingQuestion || q.id !== editingQuestion.id) // Don't allow selecting itself
                  .map(q => (
                    <option key={q.id} value={q.id}>
                      {q.text.substring(0, 60)}{q.text.length > 60 ? '...' : ''}
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Child questions automatically inherit discrimination codes from parent
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (for admins)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Optional description for admin reference"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Input Type *
              </label>
              <select
                value={formData.inputType}
                onChange={(e) => setFormData({ ...formData, inputType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {INPUT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <Input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selection Weight (0-100)
              </label>
              <Input
                type="number"
                value={formData.selectionWeight}
                onChange={(e) => setFormData({ ...formData, selectionWeight: parseInt(e.target.value) || 50 })}
                min={0}
                max={100}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discriminates Visa Codes
              {!editingQuestion && <span className="text-xs text-gray-500 ml-2">(Top-level questions only)</span>}
            </label>

            {/* Show as deletable tags for top-level questions or when editing top-level questions */}
            {(!formData.parentId || (editingQuestion && !editingQuestion.parentId)) ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-md min-h-[42px] bg-white">
                  {formData.discriminatesVisaCodes?.split(',').filter(code => code.trim()).map((code, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {code.trim()}
                      <button
                        type="button"
                        onClick={() => {
                          const codes = formData.discriminatesVisaCodes?.split(',').filter(c => c.trim()) || [];
                          codes.splice(index, 1);
                          setFormData({ ...formData, discriminatesVisaCodes: codes.join(',') });
                        }}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-blue-600 hover:bg-blue-200 hover:text-blue-900 rounded-full"
                      >
                        ×
                      </button>
                    </span>
                  )) || <span className="text-gray-400 text-sm">No visa codes specified</span>}
                </div>
                <Input
                  type="text"
                  placeholder="Add visa code (e.g., H-1B) and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      const newCode = input.value.trim();
                      if (newCode) {
                        const existingCodes = formData.discriminatesVisaCodes?.split(',').filter(c => c.trim()) || [];
                        if (!existingCodes.includes(newCode)) {
                          existingCodes.push(newCode);
                          setFormData({ ...formData, discriminatesVisaCodes: existingCodes.join(',') });
                        }
                        input.value = '';
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Inherited from Parent Question:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.discriminatesVisaCodes?.split(',').filter(code => code.trim()).map((code, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {code.trim()}
                      </span>
                    )) || <span className="text-gray-500 text-sm">No codes inherited (parent has no codes)</span>}
                  </div>
                </div>
                <p className="text-xs text-gray-500 italic">
                  Child questions automatically use the same discrimination codes as their parent.
                  To change these codes, edit the parent question.
                </p>
              </div>
            )}
          </div>

          {/* Document Upload Configuration */}
          {formData.inputType === 'document_upload' && (
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold text-blue-900 mb-3">Document Upload Settings</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Instructions
                  </label>
                  <textarea
                    value={(() => {
                      try {
                        return formData.pageConfig ? JSON.parse(formData.pageConfig).instructionText || '' : '';
                      } catch {
                        return '';
                      }
                    })()}
                    onChange={(e) => {
                      const config = formData.pageConfig ? JSON.parse(formData.pageConfig) : {};
                      config.instructionText = e.target.value;
                      setFormData({ ...formData, pageConfig: JSON.stringify(config) });
                    }}
                    placeholder="e.g., Please upload your passport and supporting documents"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed File Types
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['pdf', 'doc', 'docx', 'jpg', 'png', 'heic', 'xls', 'xlsx', 'csv'].map(type => (
                      <label key={type} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={(() => {
                            try {
                              const config = formData.pageConfig ? JSON.parse(formData.pageConfig) : {};
                              return config.allowedFileTypes?.includes(type) || false;
                            } catch {
                              return false;
                            }
                          })()}
                          onChange={(e) => {
                            try {
                              const config = formData.pageConfig ? JSON.parse(formData.pageConfig) : {};
                              let types = config.allowedFileTypes || [];
                              if (e.target.checked) {
                                if (!types.includes(type)) types.push(type);
                              } else {
                                types = types.filter((t: string) => t !== type);
                              }
                              config.allowedFileTypes = types;
                              setFormData({ ...formData, pageConfig: JSON.stringify(config) });
                            } catch {
                              setFormData({ ...formData, pageConfig: JSON.stringify({ allowedFileTypes: [type] }) });
                            }
                          }}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        .{type}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Files</label>
                    <Input
                      type="number"
                      min={0}
                      value={(() => {
                        try {
                          const config = formData.pageConfig ? JSON.parse(formData.pageConfig) : {};
                          return config.minFiles || 1;
                        } catch {
                          return 1;
                        }
                      })()}
                      onChange={(e) => {
                        try {
                          const config = formData.pageConfig ? JSON.parse(formData.pageConfig) : {};
                          config.minFiles = parseInt(e.target.value) || 1;
                          setFormData({ ...formData, pageConfig: JSON.stringify(config) });
                        } catch {}
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Files</label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={(() => {
                        try {
                          const config = formData.pageConfig ? JSON.parse(formData.pageConfig) : {};
                          return config.maxFiles || 5;
                        } catch {
                          return 5;
                        }
                      })()}
                      onChange={(e) => {
                        try {
                          const config = formData.pageConfig ? JSON.parse(formData.pageConfig) : {};
                          config.maxFiles = parseInt(e.target.value) || 5;
                          setFormData({ ...formData, pageConfig: JSON.stringify(config) });
                        } catch {}
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attorney Question Configuration */}
          {formData.inputType === 'attorney_question' && (
            <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
              <h3 className="font-semibold text-purple-900 mb-3">Attorney Question Page Settings</h3>
              <p className="text-sm text-gray-600 mb-3">
                This page displays visa results with action buttons.
                Should be the final question in your interview.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Results Summary Text
                  </label>
                  <textarea
                    value={(() => {
                      try {
                        return formData.pageConfig ? JSON.parse(formData.pageConfig).summaryText || '' : '';
                      } catch {
                        return '';
                      }
                    })()}
                    onChange={(e) => {
                      const config = formData.pageConfig ? JSON.parse(formData.pageConfig) : {};
                      config.summaryText = e.target.value;
                      setFormData({ ...formData, pageConfig: JSON.stringify(config) });
                    }}
                    placeholder="e.g., Based on your responses, here are your visa options:"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Call-to-Action Text
                  </label>
                  <input
                    type="text"
                    value={(() => {
                      try {
                        return formData.pageConfig ? JSON.parse(formData.pageConfig).ctaText || '' : '';
                      } catch {
                        return '';
                      }
                    })()}
                    onChange={(e) => {
                      const config = formData.pageConfig ? JSON.parse(formData.pageConfig) : {};
                      config.ctaText = e.target.value;
                      setFormData({ ...formData, pageConfig: JSON.stringify(config) });
                    }}
                    placeholder="e.g., Ready to get started? Register or schedule a consultation."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isRequired}
                onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">Required Question</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-900">Active (visible to users)</span>
            </label>
          </div>

          {/* Options Management */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-700">
                Answer Options ({formData.options.length})
              </label>
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                + Add Option
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                  <Input
                    type="text"
                    value={option.value}
                    onChange={(e) => updateOption(index, 'value', e.target.value)}
                    placeholder="Value (e.g., yes)"
                    className="flex-1"
                  />
                  <Input
                    type="text"
                    value={option.label}
                    onChange={(e) => updateOption(index, 'label', e.target.value)}
                    placeholder="Label (e.g., Yes)"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={option.displayOrder}
                    onChange={(e) => updateOption(index, 'displayOrder', parseInt(e.target.value) || 0)}
                    placeholder="Order"
                    className="w-20"
                  />
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={option.isActive}
                      onChange={(e) => updateOption(index, 'isActive', e.target.checked)}
                      className="h-4 w-4"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingQuestion ? 'Update Question' : 'Create Question'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirm Delete"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete the question <strong>{questionToDelete?.key}</strong>?
            This action cannot be undone and will affect the customer interview immediately.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Category Editor Modal */}
      <Modal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Edit Interview Categories"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Manage the categories used to organize interview questions. Changes will apply to future questions.
          </p>

          <div className="space-y-2">
            {categories.map((cat, index) => (
              <div key={index} className="flex items-center space-x-2 bg-gray-50 p-3 rounded">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Value (key)</label>
                  <Input
                    type="text"
                    value={cat.value}
                    onChange={(e) => updateCategory(index, 'value', e.target.value)}
                    placeholder="category_key"
                    className="mb-2"
                  />
                  <label className="block text-xs text-gray-500 mb-1">Label (display name)</label>
                  <Input
                    type="text"
                    value={cat.label}
                    onChange={(e) => updateCategory(index, 'label', e.target.value)}
                    placeholder="Display Name"
                  />
                </div>
                <button
                  onClick={() => removeCategory(index)}
                  className="mt-6 text-red-600 hover:text-red-800 p-2"
                  title="Remove category"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addCategory} className="w-full">
            + Add Category
          </Button>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveCategoryChanges}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
