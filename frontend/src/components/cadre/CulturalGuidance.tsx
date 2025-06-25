import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Language,
  Psychology,
  ExpandMore,
  People,
  RecordVoiceOver,
  School,
  HealthAndSafety,
  Translate,
  EmojiPeople,
  SupportAgent,
} from '@mui/icons-material';

interface CulturalResource {
  id: string;
  title: string;
  category: 'language' | 'belief' | 'practice' | 'communication';
  content: string;
  tags: string[];
}

interface CommunityProfile {
  id: string;
  name: string;
  languages: string[];
  beliefs: string[];
  healthPractices: string[];
  communicationStyle: string;
  sensitivities: string[];
}

const CulturalGuidance: React.FC = () => {
  const [resources, setResources] = useState<CulturalResource[]>([]);
  const [communityProfiles, setCommunityProfiles] = useState<CommunityProfile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<CulturalResource | null>(null);

  useEffect(() => {
    // Mock data for cultural resources
    const mockResources: CulturalResource[] = [
      {
        id: '1',
        title: 'Skin Health in Traditional Medicine',
        category: 'belief',
        content: `Understanding traditional perspectives on skin health and how to bridge them with modern AI diagnosis.
        
        Key Points:
        • Respect traditional healing beliefs while introducing AI insights
        • Explain how technology complements traditional knowledge
        • Use familiar concepts to explain skin conditions
        • Address concerns about modern technology respectfully`,
        tags: ['traditional medicine', 'skin health', 'ai explanation']
      },
      {
        id: '2',
        title: 'Culturally Sensitive Communication',
        category: 'communication',
        content: `Guidelines for discussing health concerns with community members in culturally appropriate ways.
        
        Communication Strategies:
        • Use local language and terminology when possible
        • Respect hierarchy and family decision-making processes
        • Allow time for questions and concerns
        • Provide visual aids and simple explanations
        • Include family members in discussions when appropriate`,
        tags: ['communication', 'family involvement', 'respect']
      },
      {
        id: '3',
        title: 'Religious Considerations in Healthcare',
        category: 'belief',
        content: `Navigating religious beliefs and practices when providing health guidance.
        
        Important Considerations:
        • Respect religious practices and timing
        • Understand modesty requirements
        • Work with religious leaders when appropriate
        • Explain medical necessity with sensitivity
        • Offer alternatives when practices conflict`,
        tags: ['religion', 'modesty', 'sensitivity']
      },
      {
        id: '4',
        title: 'Local Language Translation Guide',
        category: 'language',
        content: `Key medical terms and AI explanations in local languages with cultural context.
        
        Essential Translations:
        • Skin lesion → [Local term with explanation]
        • AI analysis → [Technology explanation in cultural context]
        • Risk level → [Risk communication in appropriate language]
        • Medical consultation → [Healthcare visit explanation]
        • Prevention → [Health maintenance in cultural terms]`,
        tags: ['translation', 'medical terms', 'local language']
      }
    ];

    const mockProfiles: CommunityProfile[] = [
      {
        id: '1',
        name: 'Rural Thailand Community',
        languages: ['Thai', 'Local dialect'],
        beliefs: ['Buddhist principles', 'Traditional medicine', 'Family-centered decisions'],
        healthPractices: ['Herbal remedies', 'Temple blessing', 'Community elder consultation'],
        communicationStyle: 'Respectful, indirect, hierarchical',
        sensitivities: ['Religious timing', 'Elder respect', 'Face-saving']
      },
      {
        id: '2',
        name: 'Indonesian Island Community',
        languages: ['Bahasa Indonesia', 'Javanese'],
        beliefs: ['Islamic principles', 'Local customs', 'Community harmony'],
        healthPractices: ['Traditional healers', 'Religious prayer', 'Community support'],
        communicationStyle: 'Polite, community-focused, religious consideration',
        sensitivities: ['Prayer times', 'Modesty requirements', 'Community consensus']
      }
    ];

    setResources(mockResources);
    setCommunityProfiles(mockProfiles);
  }, []);

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { value: 'all', label: 'All Resources', icon: <Language /> },
    { value: 'belief', label: 'Cultural Beliefs', icon: <Psychology /> },
    { value: 'communication', label: 'Communication', icon: <RecordVoiceOver /> },
    { value: 'language', label: 'Language', icon: <Translate /> },
    { value: 'practice', label: 'Health Practices', icon: <HealthAndSafety /> }
  ];

  const handleResourceClick = (resource: CulturalResource) => {
    setSelectedResource(resource);
    setDialogOpen(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EmojiPeople color="primary" />
          Cultural Health Guidance
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bridge AI insights with culturally sensitive care for your community
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Your Role as Cultural Bridge:</strong> You transform complex AI medical insights into culturally appropriate guidance that resonates with your community's values, beliefs, and practices.
        </Typography>
      </Alert>

      {/* Search and Filter */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
          <Box sx={{ flex: 1, width: '100%' }}>
            <TextField
              fullWidth
              placeholder="Search cultural resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="small"
            />
          </Box>
          <Box sx={{ flex: 1, width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {categories.map((category) => (
                <Chip
                  key={category.value}
                  icon={category.icon}
                  label={category.label}
                  variant={selectedCategory === category.value ? 'filled' : 'outlined'}
                  color={selectedCategory === category.value ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory(category.value)}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
        {/* Cultural Resources */}
        <Box sx={{ flex: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <School color="primary" />
            Cultural Bridge Resources
          </Typography>
          
          {filteredResources.map((resource) => (
            <Card key={resource.id} sx={{ mb: 2, cursor: 'pointer' }} onClick={() => handleResourceClick(resource)}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6">{resource.title}</Typography>
                  <Chip 
                    size="small" 
                    label={resource.category} 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {resource.content.split('\n')[0]}...
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {resource.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Community Profiles */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People color="primary" />
            Community Profiles
          </Typography>
          
          {communityProfiles.map((profile) => (
            <Card key={profile.id} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>{profile.name}</Typography>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">Cultural Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><Language fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="Languages" 
                          secondary={profile.languages.join(', ')}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><Psychology fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="Beliefs" 
                          secondary={profile.beliefs.join(', ')}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><HealthAndSafety fontSize="small" /></ListItemIcon>
                        <ListItemText 
                          primary="Health Practices" 
                          secondary={profile.healthPractices.join(', ')}
                        />
                      </ListItem>
                    </List>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Resource Detail Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SupportAgent color="primary" />
          {selectedResource?.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
            {selectedResource?.content}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {selectedResource?.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" color="primary" variant="outlined" />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => setDialogOpen(false)}>
            Save to My Resources
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CulturalGuidance;
