import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (term: string) => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [term, setTerm] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(term);
  };
  
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search genres, artists... (press Enter)"
        className={`w-full bg-gray-900/80 border rounded-lg py-2 px-4 transition-all duration-300 outline-none placeholder-gray-500 focus:ring-2 disabled:opacity-50`}
        style={{
            color: 'var(--color-secondary)',
            borderColor: 'var(--color-secondary)',
            '--tw-ring-color': 'var(--color-primary)'
        } as React.CSSProperties}
        disabled={isLoading}
      />
    </form>
  );
};

export default SearchBar;