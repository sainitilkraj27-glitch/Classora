import React, { useState } from 'react';
import { Smile, Search, Sparkles, BookOpen, ThumbsUp, Heart, Star } from 'lucide-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    id: 'popular',
    name: 'Popular',
    icon: Sparkles,
    emojis: ['👍', '❤️', '🔥', '🎉', '👏', '😊', '😂', '✨', '💯', '🙌', '🙏', '😍', '🤩', '🚀', '⭐'],
  },
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉',
      '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😜', '🤪', '😎',
      '🤓', '🧐', '🥳', '😏', '🤔', '🤫', '🫡', '🥱', '😴', '😌',
      '😢', '😭', '🤯', '😱', '🥺', '😳', '🤗', '🤝', '💪', '✌️',
    ],
  },
  {
    id: 'study',
    name: 'Education & Study',
    icon: BookOpen,
    emojis: [
      '📚', '📖', '🎓', '📝', '✏️', '✍️', '💡', '🔍', '🔬', '🧪',
      '💻', '🖥️', '📊', '📈', '📌', '📎', '📐', '📏', '🧮', '🏫',
      '🧑‍🏫', '🧑‍🎓', '🏆', '🥇', '🎯', '⏰', '⏳', '📅', '📜', '📁',
    ],
  },
  {
    id: 'gestures',
    name: 'Gestures & Symbols',
    icon: ThumbsUp,
    emojis: [
      '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
      '👆', '👇', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '👏', '🙌',
      '👐', '🤲', '🙏', '✍️', '💪', '❤️', '🧡', '💛', '💚', '💙',
      '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗',
    ],
  },
  {
    id: 'celebrate',
    name: 'Celebration & Badges',
    icon: Star,
    emojis: [
      '🎉', '🎊', '🎈', '🎁', '🎂', '✨', '🌟', '⭐', '💫', '⚡',
      '💥', '🔥', '💯', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '👑',
      '🚀', '🛸', '🎯', '🎲', '🎨', '🎬', '🎤', '🎧', '📢', '🔔',
    ],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [activeTab, setActiveTab] = useState('popular');
  const [search, setSearch] = useState('');

  const activeCategory = EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];

  const filteredEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((emoji, idx, self) => self.indexOf(emoji) === idx)
    : activeCategory.emojis;

  return (
    <div className="w-72 sm:w-80 bg-slate-900 border border-slate-700/80 rounded-2xl p-3 shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150 z-50">
      {/* Header with Search and Close */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold"
        >
          ✕
        </button>
      </div>

      {/* Category Tabs */}
      {!search.trim() && (
        <div className="flex items-center gap-1 border-b border-slate-800 pb-1.5 overflow-x-auto no-scrollbar">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`p-1.5 rounded-lg flex items-center gap-1 text-[11px] font-medium transition shrink-0 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={cat.name}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="max-h-48 overflow-y-auto grid grid-cols-7 sm:grid-cols-8 gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800/60">
        {filteredEmojis.map((emoji, index) => (
          <button
            key={`${emoji}-${index}`}
            type="button"
            onClick={() => onSelectEmoji(emoji)}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 hover:scale-125 transition flex items-center justify-center text-lg active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="text-[10px] text-slate-500 text-center">
        Click any emoji to insert into message
      </div>
    </div>
  );
};
