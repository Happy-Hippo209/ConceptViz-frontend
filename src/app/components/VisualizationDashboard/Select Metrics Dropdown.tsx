"use client";
import {AttributeSelectProps} from "@/types/types";
import {
  Checkbox, 
  FormControl, 
  InputLabel, 
  ListItemText, 
  MenuItem, 
  OutlinedInput, 
  Select,
  Chip,
  Box,
  Typography,
  Divider,
  ListSubheader
} from "@mui/material";
import React, { useMemo } from "react";
// 导入图标
import BarChartIcon from '@mui/icons-material/BarChart';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FolderIcon from '@mui/icons-material/Folder';
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { toggleMetricGroup, setSelectedAttrs as setReduxSelectedAttrs } from "@/redux/features/modelSlice";

// Group names mapping for display
const groupDisplayNames = {
  unsupervised: "Unsupervised Metrics",
  sparseProbing: "Sparse Probing",
  spuriousCorrelation: "Spurious Correlation Removal",
  targetedProbe: "Targeted Probe Perturbation",
  topScores: "Top Scores"
};

const SelectMetricsDropdown: React.FC<AttributeSelectProps> = ({selectedAttrs, setSelectedAttrs, metricOptions,}) => {
  const dispatch = useDispatch();
  const { metricGroups } = useSelector((state: RootState) => state.model);
  
  // Group metrics by their categories
  const groupedMetrics = useMemo(() => {
    const result: Record<string, typeof metricOptions> = {};
    
    // Initialize groups
    Object.keys(metricGroups).forEach(group => {
      result[group] = [];
    });
    
    // Populate groups with metrics
    metricOptions.forEach(option => {
      // Find which group this metric belongs to
      for (const [group, metrics] of Object.entries(metricGroups)) {
        if (metrics.includes(option.value)) {
          result[group].push(option);
          break;
        }
      }
    });
    
    return result;
  }, [metricOptions, metricGroups]);
  
  // Check if all metrics in a group are selected
  const isGroupSelected = (group: string) => {
    const groupMetrics = metricGroups[group] || [];
    return groupMetrics.every(metric => selectedAttrs.includes(metric));
  };
  
  // Check if some (but not all) metrics in a group are selected
  const isGroupPartiallySelected = (group: string) => {
    const groupMetrics = metricGroups[group] || [];
    const selectedCount = groupMetrics.filter(metric => selectedAttrs.includes(metric)).length;
    return selectedCount > 0 && selectedCount < groupMetrics.length;
  };
  
  // Handle group selection/deselection
  const handleGroupToggle = (group: string) => {
    const selected = !isGroupSelected(group);
    dispatch(toggleMetricGroup({ group, selected }));
    
    // Update local component state to match Redux state
    const groupMetrics = metricGroups[group] || [];
    if (selected) {
      // Add all metrics from the group that aren't already selected
      const newAttrs = [...selectedAttrs];
      groupMetrics.forEach(metric => {
        if (!newAttrs.includes(metric)) {
          newAttrs.push(metric);
        }
      });
      setSelectedAttrs(newAttrs);
    } else {
      // Remove all metrics from the group
      const newAttrs = selectedAttrs.filter(
        attr => !groupMetrics.includes(attr)
      );
      // Ensure at least one metric is selected
      setSelectedAttrs(newAttrs.length > 0 ? newAttrs : ["l2_ratio"]);
    }
  };

  return (
    <FormControl 
      size="small"
      sx={{
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        display: 'flex',
        "& .MuiOutlinedInput-root": {
          height: '100%',
          borderRadius: '8px',
          transition: 'all 0.2s ease-in-out',
          "&:hover": {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          },
          "& .MuiOutlinedInput-notchedOutline": {
            border: "2px solid #e0e0e0"
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            border: "none"
          },
          "&.Mui-focused": {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            border: "none"
          },
        },
        "& .MuiInputLabel-root": {
          "&.Mui-focused": {color: "#1976d1"},
          fontWeight: 500,
          fontSize: '1.1rem',
        }
      }}
    >
      <InputLabel id="attribute-select-label">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <BarChartIcon sx={{ fontSize: 20 }} />
          <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>Metrics</Typography>
        </Box>
      </InputLabel>
      <Select 
        labelId="attribute-select-label" 
        multiple 
        value={selectedAttrs}
        onChange={(e) => {
          // This will be triggered when clicking on MenuItems, but not our custom checkboxes
          // because we're stopping propagation on checkbox clicks
          const value = e.target.value as string[];
          setSelectedAttrs(value.length > 0 ? value : ["l2_ratio"]);
        }}
        input={<OutlinedInput label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <BarChartIcon sx={{ fontSize: 20 }} />
            <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>Select Metrics</Typography>
          </Box>
        }/>}
        IconComponent={() => <KeyboardArrowDownIcon sx={{ opacity: 0 }} />}
        sx={{ 
          height: '100%',
          "& .MuiSelect-select": {
            display: 'flex',
            flexWrap: 'nowrap',
            gap: '4px',
            alignItems: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }
        }}
        renderValue={(selected) => (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'nowrap',
            gap: 0.5,
            width: '100%',
          }}>
            {selected.map((value, index) => {
              const option = metricOptions.find((opt) => opt.value === value);
              if (index < 3) {
                return (
                  <Chip
                    key={value}
                    label={option?.label}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      borderRadius: '16px',
                      color: '#1976d2',
                      fontWeight: 500,
                      fontSize: '1rem',
                      flexShrink: 0,
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.12)',
                      },
                    }}
                  />
                );
              } else if (index === 3) {
                return (
                  <Chip
                    key="more"
                    label={`+${selected.length - 3} more`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      borderRadius: '16px',
                      color: '#1976d2',
                      fontWeight: 500,
                      fontSize: '1.2rem',
                      flexShrink: 0,
                    }}
                  />
                );
              }
              return null;
            })}
          </Box>
        )}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 400,
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
              marginTop: 8,
            },
          },
          MenuListProps: {
            style: {
              padding: '8px',
            }
          }
        }}
      >
        {Object.entries(groupedMetrics).map(([group, options]) => [
          // Group header with checkbox
          <ListSubheader 
            key={`group-${group}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              my: 1,
              py: 1,
              px: 1.5,
              lineHeight: '1.5',
              color: '#333',
              fontWeight: 600,
              fontSize: '1.1rem',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: '#f0f0f0',
              }
            }}
            onClick={() => handleGroupToggle(group)}
          >
            <Checkbox 
              checked={isGroupSelected(group)}
              indeterminate={isGroupPartiallySelected(group)}
              size="small"
              icon={<Box sx={{ width: 18, height: 18 }} />}
              checkedIcon={<CheckCircleIcon fontSize="small" />}
              onClick={(e) => {
                e.stopPropagation(); // Prevent the ListSubheader onClick from firing
                handleGroupToggle(group);
              }}
              sx={{
                color: "#9e9e9e",
                padding: '4px',
                marginRight: '8px',
                "&.Mui-checked": {
                  color: "#1976d1",
                },
              }}
            />
            <FolderIcon sx={{ fontSize: 20, mr: 1, color: '#1976d1' }} />
            {groupDisplayNames[group as keyof typeof groupDisplayNames] || group}
          </ListSubheader>,
          
          // Group items
          ...options.map((option) => (
            <MenuItem 
              key={option.value}
              value={option.value}
              dense
              sx={{
                py: 1,
                px: 1.5,
                ml: 3, // Indent to show hierarchy
                borderRadius: '8px',
                my: 0.5,
                minHeight: "40px",
                "&:hover": {
                  backgroundColor: "rgba(25, 118, 209, 0.04)",
                },
                "&.Mui-selected": {
                  backgroundColor: "rgba(25, 118, 209, 0.08)",
                },
                "&.Mui-selected:hover": {
                  backgroundColor: "rgba(25, 118, 209, 0.12)",
                },
              }}
            >
              <Checkbox 
                checked={selectedAttrs.indexOf(option.value) > -1}
                size="small"
                icon={<Box sx={{ width: 18, height: 18 }} />}
                checkedIcon={<CheckCircleIcon fontSize="small" />}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent MenuItem default behavior
                  const newSelectedAttrs = [...selectedAttrs];
                  const index = newSelectedAttrs.indexOf(option.value);
                  
                  if (index === -1) {
                    // Add the metric
                    newSelectedAttrs.push(option.value);
                  } else {
                    // Remove the metric
                    newSelectedAttrs.splice(index, 1);
                  }
                  
                  // Ensure at least one metric is selected
                  const finalAttrs = newSelectedAttrs.length > 0 ? newSelectedAttrs : ["l2_ratio"];
                  setSelectedAttrs(finalAttrs);
                  
                  // Update Redux state
                  dispatch(setReduxSelectedAttrs(finalAttrs));
                }}
                sx={{
                  color: "#9e9e9e",
                  padding: '4px',
                  marginRight: '8px',
                  "&.Mui-checked": {
                    color: "#1976d1",
                  },
                }}
              />
              <ListItemText 
                primary={option.label}
                sx={{
                  "& .MuiListItemText-primary": {
                    fontSize: "1.1rem",
                    fontWeight: selectedAttrs.indexOf(option.value) > -1 ? 600 : 400,
                  },
                }}
              />
            </MenuItem>
          )),
          
          // Add divider between groups
          <Divider key={`divider-${group}`} sx={{ my: 1 }} />
        ]).flat().slice(0, -1)} {/* Remove the last divider */}
      </Select>
    </FormControl>
  );
};

export default SelectMetricsDropdown;
