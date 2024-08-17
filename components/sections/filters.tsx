import { categories } from '@/app/types/institutions';
import React, { useEffect, useState } from 'react'

type Props = {
  onChange: (props: {
    categories: string[];
  }) => void;
}

const Filters = (props: Props) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const mappedCategories = Object.keys(categories).map((category) => ({
    label: categories[category as keyof typeof categories].label,
    value: category,
  }));

  useEffect(() => {
    props.onChange({
      categories: selectedCategories,
    })
  }, [selectedCategories]);

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      <p>Select Filters: </p>
      {
        mappedCategories.map((category) => (
          <button key={category.value} onClick={() => {
            if (selectedCategories.includes(category.value)) {
              setSelectedCategories(selectedCategories.filter((c) => c !== category.value));
            } else {
              setSelectedCategories([...selectedCategories, category.value]);
            }
          }} data-active={selectedCategories.includes(category.value)} className="px-2 py-1 rounded text-sm font-bold data-[active=true]:bg-blue-500 data-[active=true]:text-white">
            {category.label}
          </button>
        ))
      }
    </div>
  )
}

export default Filters