"use client";
import {Button, Stack, TextField, Typography, Paper, Chip, Select, MenuItem, FormControl} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import React from "react";
import {useAppDispatch, useAppSelector} from "@/redux/hooks";
import {submitQuery} from "@/redux/features/querySlice";
import {setSelectedLLM} from "@/redux/features/llmSlice"; 
import {QueryInputProps} from "@/types/types";

interface QueryComponent {
  type: 'text' | 'tag';
  content: string;
  tagType?: 'topic' | 'scope' | 'association';
}

const QueryInput = ({onSubmit}: QueryInputProps) => {
  const dispatch = useAppDispatch();
  const optimizedQuery = useAppSelector(state => state.query.optimizedQuery);
  const selectedLLM = useAppSelector(state => state.llm.selectedLLM); 
  const availableLLMs = useAppSelector(state => state.llm.availableLLMs);
  const [localQuery, setLocalQuery] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  // Handling model selection changes
  const handleLLMChange = (event: any) => {
    dispatch(setSelectedLLM(event.target.value));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      dispatch(submitQuery({
        query: localQuery.trim(),
        llm: selectedLLM
      }));
      onSubmit(localQuery.trim(), selectedLLM); 
    }
  };

  const getTagProps = (tagType: string, isSelected: boolean) => {
    if (isSelected) {
      return { color: 'primary' as const, variant: 'filled' as const };
      switch (tagType) {
        case 'topic':
          return { color: 'secondary' as const, variant: 'filled' as const };
        case 'scope':
          return { color: 'success' as const, variant: 'filled' as const };
        case 'association':
          return { color: 'primary' as const, variant: 'filled' as const };
        default:
          return { color: 'primary' as const, variant: 'filled' as const };
      }
    } else {
      return { color: 'primary' as const, variant: 'outlined' as const };
      switch (tagType) {
        case 'topic':
          return { color: 'secondary' as const, variant: 'outlined' as const };
        case 'scope':
          return { color: 'success' as const, variant: 'outlined' as const };
        case 'association':
          return { color: 'primary' as const, variant: 'outlined' as const };
        default:
          return { color: 'default' as const, variant: 'outlined' as const };
      }
    }
  };

  const getHoverStyle = (tagType: string, isSelected: boolean) => {
    if (isSelected) {
      return 'rgba(25, 118, 210, 0.8)';
      switch (tagType) {
        case 'topic':
          return 'rgba(156, 39, 176, 0.8)';
        case 'scope':
          return 'rgba(46, 125, 50, 0.8)';
        case 'association':
          return 'rgba(25, 118, 210, 0.8)';
        default:
          return 'rgba(25, 118, 210, 0.8)';
      }
    } else {
      return 'rgba(25, 118, 210, 0.1)';
      switch (tagType) {
        case 'topic':
          return 'rgba(156, 39, 176, 0.1)';
        case 'scope':
          return 'rgba(46, 125, 50, 0.1)';
        case 'association':
          return 'rgba(25, 118, 210, 0.1)';
        default:
          return 'rgba(25, 118, 210, 0.1)';
      }
    }
  };

  // Parse the query and generate structured components
  const parseQueryStructure = React.useMemo((): QueryComponent[] => {
    if (!optimizedQuery) return [];
    
    const components: QueryComponent[] = [];
    
    if (optimizedQuery.includes('and its associations with')) {
      const mainParts = optimizedQuery.split('and its associations with');
      if (mainParts.length >= 2) {
        // "references to" 
        components.push({ type: 'text', content: 'references to ' });
        
        // topic tags
        const mainTopic = mainParts[0].replace(/^references to /, '').trim();
        if (mainTopic) {
          components.push({ type: 'tag', content: mainTopic, tagType: 'topic' });
        }
        
        // "and its associations with" 
        components.push({ type: 'text', content: ' and its associations with ' });
        
        const associations = mainParts[1];
        if (associations.includes(' across ')) {
          const [assocPart, scopePart] = associations.split(' across ');

          // association tags
          const assocItems = assocPart.split(',').map(item => item.trim()).filter(item => item);
          assocItems.forEach((item, index) => {
            if (index > 0) {
              components.push({ type: 'text', content: ', ' });
            }
            const cleanItem = item.replace(/^(and |or )/i, '').trim();
            if (cleanItem) {
              components.push({ type: 'tag', content: cleanItem, tagType: 'association' });
            }
          });
          
          // "across" 
          components.push({ type: 'text', content: ' across ' });

          // scope tags
          const scope = scopePart.trim();
          if (scope) {
            const scopeParts = scope.split(',').map(part => part.trim());
            
            scopeParts.forEach((part, partIndex) => {
              if (partIndex > 0) {
                components.push({ type: 'text', content: ', ' });
              }
              
              if (part.includes(' and ')) {
                const andParts = part.split(' and ').map(p => p.trim());
                andParts.forEach((andPart, andIndex) => {
                  if (andIndex > 0) {
                    components.push({ type: 'text', content: ' and ' });
                  }
                  if (andPart) {
                    components.push({ type: 'tag', content: andPart, tagType: 'scope' });
                  }
                });
              } else {
                components.push({ type: 'tag', content: part, tagType: 'scope' });
              }
            });
          }
        } else {
          const assocItems = associations.split(',').map(item => item.trim()).filter(item => item);
          assocItems.forEach((item, index) => {
            if (index > 0) {
              components.push({ type: 'text', content: ', ' });
            }
            const cleanItem = item.replace(/^(and |or )/i, '').trim();
            if (cleanItem) {
              components.push({ type: 'tag', content: cleanItem, tagType: 'association' });
            }
          });
        }
      }
    } else {
      const parts = optimizedQuery.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      parts.forEach((part, index) => {
        if (index > 0) {
          components.push({ type: 'text', content: ', ' });
        }
        const cleanPart = part.replace(/^['"]|['"]$/g, '').replace(/^(and |or )/i, '').trim();
        const tagType: 'topic' | 'scope' | 'association' = index === 0 ? 'topic' : 
          (cleanPart.includes('academic') || cleanPart.includes('literature') || 
          cleanPart.includes('publications') || cleanPart.includes('research') ||
          cleanPart.includes('industry') || cleanPart.includes('scientific') ||
          cleanPart.includes('medical') || cleanPart.includes('clinical') ||
          cleanPart.includes('educational') || cleanPart.includes('professional') ||
          cleanPart.includes('reports') || cleanPart.includes('studies') ||
          cleanPart.includes('guidelines') || cleanPart.includes('documentation')) ? 'scope' : 'association';
        
        components.push({ 
          type: 'tag', 
          content: cleanPart,
          tagType: tagType
        });
      });
    }
    
    return components;
  }, [optimizedQuery]);

  const queryTags = React.useMemo(() => {
    return parseQueryStructure
      .filter(component => component.type === 'tag')
      .map(component => component.content)
      .filter(content => content.length > 2);
  }, [parseQueryStructure]);

  const buildQuery = (selectedTags: string[]) => {
    if (selectedTags.length === 0) return '';
    if (selectedTags.length === 1) return selectedTags[0];
    
    const topicTags = parseQueryStructure
      .filter(comp => comp.type === 'tag' && comp.tagType === 'topic')
      .map(comp => comp.content);
    
    const hasMainTopic = selectedTags.some(tag => topicTags.includes(tag));
    
    if (hasMainTopic && selectedTags.length > 1) {
      const mainTopic = selectedTags.find(tag => topicTags.includes(tag)) || selectedTags[0];
      const otherTags = selectedTags.filter(tag => tag !== mainTopic);
      
      const allScopeTags = parseQueryStructure
        .filter(comp => comp.type === 'tag' && comp.tagType === 'scope')
        .map(comp => comp.content);
      
      const scopeTags = otherTags.filter(tag => allScopeTags.includes(tag));
      const assocTags = otherTags.filter(tag => !scopeTags.includes(tag));
      
      let query = `${mainTopic}`;
      
      if (assocTags.length > 0) {
        query += ` and its associations with ${assocTags.join(', ')}`;
      }
      
      if (scopeTags.length > 0) {
        if (scopeTags.length === 1) {
          query += ` across ${scopeTags[0]}`;
        } else {
          const lastScope = scopeTags[scopeTags.length - 1];
          const restScopes = scopeTags.slice(0, -1);
          query += ` across ${restScopes.join(', ')} and ${lastScope}`;
        }
      }
      
      return query;
    }
    
    return selectedTags.join(', ');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      let newSelectedTags;
      if (prev.includes(tag)) {
        newSelectedTags = prev.filter(t => t !== tag);
      } else {
        newSelectedTags = [...prev, tag];
      }
      
      const newQuery = buildQuery(newSelectedTags);
      setLocalQuery(newQuery);
      
      return newSelectedTags;
    });
  };


  const handleUseFullRecommendation = () => {
    if (optimizedQuery) {
      setLocalQuery(optimizedQuery);
      setSelectedTags(queryTags);
    }
  };


  React.useEffect(() => {
    setSelectedTags([]);
  }, [optimizedQuery]);

  return (
    <div className="w-full">
      <Stack direction="row" spacing={2} alignItems="center" sx={{ marginBottom: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '20px' }}>
          Concept Query -
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={selectedLLM}
            onChange={handleLLMChange}
            displayEmpty
            sx={{
              "& .MuiSelect-select": {
                padding: "4px 8px",
                fontSize: "16px",
                fontWeight: "bold",
                color: "primary.main"
              },
              "& .MuiOutlinedInput-notchedOutline": {
                border: "1px solid",
                borderColor: "primary.main"
              }
            }}
          >
            {availableLLMs.map((llm) => (
              <MenuItem key={llm.value} value={llm.value}>
                {llm.display}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <form onSubmit={handleSubmit}>
        <Stack direction="row" spacing={1} alignItems="center" className="mb-2 w-full">
          <TextField 
            size="small" 
            fullWidth 
            label="Enter your query" 
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            sx={{
              "& .MuiInputBase-root": {
                height: "30px",
              },
            }}
          />
          <Button variant="contained" type="submit" size="small" startIcon={<SearchIcon/>}>
            Query
          </Button>
        </Stack>
      </form>

      {optimizedQuery && (
        <Paper
          elevation={0} 
          variant="outlined" 
          sx={{ 
            padding: '8px 16px', 
            marginTop: '4px', 
            marginBottom: '12px',
            backgroundColor: 'rgba(232, 244, 253, 0.6)',
            maxHeight: '85px',
            overflow: 'auto',
          }}
        >
          <Stack spacing={-0.3}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <AutoFixHighIcon color="primary" fontSize="small" />
                <Typography variant="body2" fontWeight="bold" color="primary">
                  Recommended:
                </Typography>
              </Stack>
              <Chip 
                label="Use Full" 
                size="small" 
                color="primary" 
                variant="outlined" 
                onClick={handleUseFullRecommendation}
                sx={{ cursor: 'pointer' }}
              />
            </div>
            
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '1px', 
              alignItems: 'center',
              lineHeight: '1.5'
            }}>
              {parseQueryStructure.map((component, index) => {
                if (component.type === 'text') {
                  return (
                    <Typography 
                      key={index} 
                      variant="body2" 
                      component="span"
                      sx={{ 
                        color: 'text.secondary',
                        fontStyle: 'italic',
                        whiteSpace: 'pre'
                      }}
                    >
                      {component.content}
                    </Typography>
                  );
                } else {
                  const isSelected = selectedTags.includes(component.content);
                  const tagType = component.tagType || 'association';
                  const tagProps = getTagProps(tagType, isSelected);
                  
                  return (
                    <Chip
                      key={index}
                      label={component.content}
                      size="small"
                      variant={tagProps.variant}
                      color={tagProps.color}
                      onClick={() => toggleTag(component.content)}
                      sx={{ 
                        cursor: 'pointer',
                        margin: '1px',
                        '&:hover': {
                          backgroundColor: getHoverStyle(tagType, isSelected)
                        }
                      }}
                    />
                  );
                }
              })}
            </div>
          </Stack>
        </Paper>
      )}
    </div>
  );
};

export default QueryInput;