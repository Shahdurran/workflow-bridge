import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Zap, Filter } from 'lucide-react';
import { useLocation } from 'wouter';
import { getTemplates } from '@/services/api';
import { PLATFORMS } from '@/lib/constants';
import Header from '@/components/common/Header';
import { useToast } from '@/hooks/use-toast';

const TEMPLATE_CATEGORIES = [
  'All',
  'Email Marketing',
  'CRM',
  'Project Management',
  'Social Media',
  'E-commerce',
  'Forms & Surveys',
  'Analytics',
  'Communication'
];

export default function Templates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [searchQuery, selectedCategory, selectedPlatform, templates]);

  const loadTemplates = async () => {
    try {
      const data = await getTemplates();
      // Backend returns { templates: [], total: 0, ... }
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];
    
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(t => 
        t.tags?.includes(selectedCategory.toLowerCase().replace(' ', '_'))
      );
    }
    
    if (selectedPlatform) {
      filtered = filtered.filter(t => t.platform === selectedPlatform);
    }
    
    setFilteredTemplates(filtered);
  };

  const handleUseTemplate = (template: any) => {
    // Navigate to workflow builder with template ID
    setLocation(`/builder?template=${template.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-4">Workflow Templates</h1>
            <p className="text-xl text-blue-100 mb-8">
              50+ pre-built workflow templates to get you started faster
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg bg-white text-gray-900"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-700">Filter by:</span>
          </div>
          
          {/* Platform Filter */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-600 mb-2">Platform</div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedPlatform === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlatform(null)}
              >
                All Platforms
              </Button>
              {PLATFORMS.map((platform) => (
                <Button
                  key={platform.id}
                  variant={selectedPlatform === platform.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPlatform(platform.id)}
                >
                  {platform.icon} {platform.name}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Category Filter */}
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Category</div>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_CATEGORIES.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 mb-4">No templates match your filters</p>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedPlatform(null);
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const platformData = PLATFORMS.find(p => p.id === template.platform);
              
              return (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-3xl">{platformData?.icon || '⚡'}</div>
                      <Badge>{template.platform}</Badge>
                    </div>
                    <CardTitle className="text-xl">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.tags?.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4">
                      <div className="font-medium mb-1">What it does:</div>
                      <div className="flex items-center gap-2">
                        <span>Trigger:</span>
                        <span className="font-semibold">{template.trigger_type || 'Webhook'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Actions:</span>
                        <span className="font-semibold">
                          {template.action_types?.join(', ') || 'Multiple'}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

