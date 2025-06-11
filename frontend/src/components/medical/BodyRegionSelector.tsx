// SeekWell Body Region Selector - Mobile-First Component
import React, { useState } from 'react';
import styles from './BodyRegionSelector.module.css';

interface BodyRegion {
  id: string;
  label: string;
  icon: string;
  category: 'head' | 'torso' | 'limbs' | 'other';
}

interface BodyRegionSelectorProps {
  selectedRegion?: string;
  onRegionSelect: (regionId: string) => void;
  allowMultiple?: boolean;
  selectedRegions?: string[];
  onRegionsChange?: (regionIds: string[]) => void;
  showCategories?: boolean;
  compact?: boolean;
}

const BodyRegionSelector: React.FC<BodyRegionSelectorProps> = ({
  selectedRegion,
  onRegionSelect,
  allowMultiple = false,
  selectedRegions = [],
  onRegionsChange,
  showCategories = true,
  compact = false
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const bodyRegions: BodyRegion[] = [
    // Head & Neck
    { id: 'scalp', label: 'Da đầu', icon: '🧠', category: 'head' },
    { id: 'forehead', label: 'Trán', icon: '👤', category: 'head' },
    { id: 'eyes', label: 'Mắt', icon: '👁️', category: 'head' },
    { id: 'nose', label: 'Mũi', icon: '👃', category: 'head' },
    { id: 'lips', label: 'Môi', icon: '👄', category: 'head' },
    { id: 'ears', label: 'Tai', icon: '👂', category: 'head' },
    { id: 'neck', label: 'Cổ', icon: '🧑‍⚕️', category: 'head' },
    
    // Torso
    { id: 'chest', label: 'Ngực', icon: '🫁', category: 'torso' },
    { id: 'back_upper', label: 'Lưng trên', icon: '🔙', category: 'torso' },
    { id: 'back_lower', label: 'Lưng dưới', icon: '🔙', category: 'torso' },
    { id: 'abdomen', label: 'Bụng', icon: '🤰', category: 'torso' },
    { id: 'waist', label: 'Eo', icon: '👕', category: 'torso' },
    { id: 'shoulders', label: 'Vai', icon: '💪', category: 'torso' },
    
    // Arms & Hands
    { id: 'arms_upper', label: 'Cánh tay trên', icon: '💪', category: 'limbs' },
    { id: 'arms_lower', label: 'Cẳng tay', icon: '🦾', category: 'limbs' },
    { id: 'elbows', label: 'Khuỷu tay', icon: '🦾', category: 'limbs' },
    { id: 'wrists', label: 'Cổ tay', icon: '⌚', category: 'limbs' },
    { id: 'hands', label: 'Bàn tay', icon: '✋', category: 'limbs' },
    { id: 'fingers', label: 'Ngón tay', icon: '👆', category: 'limbs' },
    
    // Legs & Feet
    { id: 'thighs', label: 'Đùi', icon: '🦵', category: 'limbs' },
    { id: 'knees', label: 'Đầu gối', icon: '🦵', category: 'limbs' },
    { id: 'calves', label: 'Bắp chân', icon: '🦵', category: 'limbs' },
    { id: 'ankles', label: 'Mắt cá chân', icon: '🦶', category: 'limbs' },
    { id: 'feet', label: 'Bàn chân', icon: '🦶', category: 'limbs' },
    { id: 'toes', label: 'Ngón chân', icon: '🦶', category: 'limbs' },
    
    // Other/Private
    { id: 'groin', label: 'Bẹn', icon: '📍', category: 'other' },
    { id: 'buttocks', label: 'Mông', icon: '📍', category: 'other' },
    { id: 'genitals', label: 'Bộ phận sinh dục', icon: '🔒', category: 'other' },
    { id: 'other', label: 'Vùng khác', icon: '📍', category: 'other' }
  ];

  const categories = [
    { id: 'all', label: 'Tất cả', icon: '🔍' },
    { id: 'head', label: 'Đầu & Cổ', icon: '🧑‍⚕️' },
    { id: 'torso', label: 'Thân mình', icon: '🫁' },
    { id: 'limbs', label: 'Tay chân', icon: '💪' },
    { id: 'other', label: 'Khác', icon: '📍' }
  ];

  const filteredRegions = activeCategory === 'all' 
    ? bodyRegions 
    : bodyRegions.filter(region => region.category === activeCategory);

  const handleRegionClick = (regionId: string) => {
    if (allowMultiple && onRegionsChange) {
      const newSelection = selectedRegions.includes(regionId)
        ? selectedRegions.filter(id => id !== regionId)
        : [...selectedRegions, regionId];
      onRegionsChange(newSelection);
    } else {
      onRegionSelect(regionId);
    }
  };

  const isSelected = (regionId: string) => {
    return allowMultiple 
      ? selectedRegions.includes(regionId)
      : selectedRegion === regionId;
  };

  const getSelectedCount = () => {
    return allowMultiple ? selectedRegions.length : (selectedRegion ? 1 : 0);
  };

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className={styles.titleIcon}>🗺️</span>
          Chọn vùng cơ thể
        </h3>
        {allowMultiple && (
          <div className={styles.selectionCount}>
            <span className={styles.countBadge}>
              {getSelectedCount()}
            </span>
            <span className={styles.countLabel}>đã chọn</span>
          </div>
        )}
      </div>

      {/* Categories */}
      {showCategories && (
        <div className={styles.categoriesContainer}>
          <div className={styles.categoriesScroll}>
            {categories.map(category => (
              <button
                key={category.id}
                className={`
                  ${styles.categoryButton}
                  ${activeCategory === category.id ? styles.categoryActive : ''}
                  touch-target
                `}
                onClick={() => setActiveCategory(category.id)}
              >
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span className={styles.categoryLabel}>{category.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search/Filter */}
      <div className={styles.searchContainer}>
        <div className={styles.searchInput}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm vùng cơ thể..."
            className={`${styles.searchField} touch-target`}
            onChange={(e) => {
              const value = e.target.value.toLowerCase();
              // Simple filter logic - in real app would be more sophisticated
              console.log('Search:', value);
            }}
          />
        </div>
      </div>

      {/* Body Regions Grid */}
      <div className={styles.regionsContainer}>
        <div className={`${styles.regionsGrid} ${compact ? styles.gridCompact : ''}`}>
          {filteredRegions.map(region => (
            <button
              key={region.id}
              className={`
                ${styles.regionButton}
                ${isSelected(region.id) ? styles.regionSelected : ''}
                ${styles[`category-${region.category}`]}
                touch-target
              `}
              onClick={() => handleRegionClick(region.id)}
            >
              <span className={styles.regionIcon}>{region.icon}</span>
              <span className={styles.regionLabel}>{region.label}</span>
              {isSelected(region.id) && (
                <span className={styles.selectedIndicator}>✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Regions Summary */}
      {allowMultiple && selectedRegions.length > 0 && (
        <div className={styles.selectedSummary}>
          <h4 className={styles.summaryTitle}>Vùng đã chọn:</h4>
          <div className={styles.selectedTags}>
            {selectedRegions.map(regionId => {
              const region = bodyRegions.find(r => r.id === regionId);
              if (!region) return null;
              
              return (
                <div key={regionId} className={styles.selectedTag}>
                  <span className={styles.tagIcon}>{region.icon}</span>
                  <span className={styles.tagLabel}>{region.label}</span>
                  <button
                    className={`${styles.removeTag} touch-target`}
                    onClick={() => {
                      if (onRegionsChange) {
                        onRegionsChange(selectedRegions.filter(id => id !== regionId));
                      }
                    }}
                    aria-label={`Bỏ chọn ${region.label}`}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
          
          {selectedRegions.length > 0 && (
            <button
              className={`${styles.clearAll} touch-target`}
              onClick={() => onRegionsChange && onRegionsChange([])}
            >
              🗑️ Xóa tất cả
            </button>
          )}
        </div>
      )}

      {/* Body Diagram (Simplified) */}
      <div className={styles.bodyDiagram}>
        <h4 className={styles.diagramTitle}>Sơ đồ cơ thể người</h4>
        <div className={styles.diagramContainer}>
          <div className={styles.bodyFront}>
            <div className={styles.bodyPart} data-region="head">👤</div>
            <div className={styles.bodyPart} data-region="chest">🫁</div>
            <div className={styles.bodyPart} data-region="arms">💪</div>
            <div className={styles.bodyPart} data-region="abdomen">🤰</div>
            <div className={styles.bodyPart} data-region="legs">🦵</div>
          </div>
          <div className={styles.diagramNote}>
            <p>💡 Nhấn vào các vùng trên để chọn nhanh</p>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className={styles.helpText}>
        <p>
          💡 <strong>Mẹo:</strong> Hãy chọn vùng cơ thể càng cụ thể càng tốt để 
          được tư vấn chính xác hơn.
        </p>
      </div>
    </div>
  );
};

export default BodyRegionSelector;
