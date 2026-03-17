import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { showNotification } from "@/components/AppNotification";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck, MessageCircle, Play, Pause, Lock, Zap, Send, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoData {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  priceInSats: number;
  views: number;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  isUnlocked: boolean;
  userReaction: string | null;
  isSaved: boolean;
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  username: string | null;
  firstName: string | null;
}

function getVideoEmbedUrl(url: string): { type: 'youtube' | 'direct' | 'other'; embedUrl: string } {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0` };
  }
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i) || url.includes('blob:') || url.includes('telegram')) {
    return { type: 'direct', embedUrl: url };
  }
  return { type: 'other', embedUrl: url };
}

function VideoPlayerComponent({ video, onBalanceUpdate }: { video: VideoData; onBalanceUpdate: () => void }) {
  const videoInfo = getVideoEmbedUrl(video.videoUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!hasTrackedView) {
      fetch(`/api/videos/${video.id}/view`, { method: 'POST', credentials: 'include' });
      setHasTrackedView(true);
    }
  }, [video.id, hasTrackedView]);

  if (videoInfo.type === 'youtube') {
    return (
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={videoInfo.embedUrl}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (videoInfo.type === 'direct') {
    return (
      <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain"
          src={video.videoUrl}
          controls
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <iframe
        className="absolute inset-0 w-full h-full"
        src={videoInfo.embedUrl}
        title={video.title}
        frameBorder="0"
        allowFullScreen
      />
    </div>
  );
}

export default function VideoPlayer() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  const { data, isLoading, refetch } = useQuery<{ success: boolean; video: VideoData }>({
    queryKey: [`/api/videos/${params.id}`],
    queryFn: async () => {
      const res = await fetch(`/api/videos/${params.id}`, { credentials: 'include' });
      return res.json();
    },
    retry: false,
  });

  const { data: commentsData, refetch: refetchComments } = useQuery<{ success: boolean; comments: Comment[] }>({
    queryKey: [`/api/videos/${params.id}/comments`],
    queryFn: async () => {
      const res = await fetch(`/api/videos/${params.id}/comments`, { credentials: 'include' });
      return res.json();
    },
    enabled: showComments,
  });

  const unlockMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/videos/${params.id}/unlock`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: (data) => {
      showNotification(`Video unlocked! New balance: ${Math.round(parseFloat(data.newBalance || '0')).toLocaleString()} SAT`, 'success');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      showNotification(error.message, 'error');
    },
  });

  const reactMutation = useMutation({
    mutationFn: async (type: 'like' | 'dislike') => {
      const res = await fetch(`/api/videos/${params.id}/react`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      return res.json();
    },
    onSuccess: () => {
      refetch();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/videos/${params.id}/save`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.json();
    },
    onSuccess: (data) => {
      showNotification(data.saved ? 'Video saved!' : 'Video removed from saved', 'success');
      refetch();
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/videos/${params.id}/comment`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      setComment("");
      refetchComments();
      refetch();
      showNotification('Comment added!', 'success');
    },
    onError: (error: Error) => {
      showNotification(error.message, 'error');
    },
  });

  const video = data?.video;
  const userBalance = parseFloat((user as any)?.balance || '0');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F5C542] animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
        <p className="text-white/60 mb-4">Video not found</p>
        <Button onClick={() => setLocation('/')} variant="outline" className="border-white/20 text-white">
          Go Back
        </Button>
      </div>
    );
  }

  const formattedViews = video.views >= 1000 ? `${(video.views / 1000).toFixed(1)}K` : video.views.toString();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <button onClick={() => setLocation('/')} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium truncate flex-1">{video.title}</span>
      </div>

      {/* Video Area */}
      {video.isUnlocked ? (
        <VideoPlayerComponent video={video} onBalanceUpdate={() => queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] })} />
      ) : (
        <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
          {video.thumbnailUrl ? (
            <img src={video.thumbnailUrl} alt={video.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0a]" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
            <div className="w-16 h-16 rounded-full bg-[#F5C542]/10 border border-[#F5C542]/30 flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#F5C542]" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">{video.priceInSats.toLocaleString()} SAT</p>
              <p className="text-white/60 text-sm mt-1">Required to watch this video</p>
            </div>
            {userBalance >= video.priceInSats ? (
              <Button
                onClick={() => unlockMutation.mutate()}
                disabled={unlockMutation.isPending}
                className="bg-[#F5C542] hover:bg-[#F5C542]/90 text-black font-bold px-8 py-3 rounded-full"
              >
                {unlockMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4 mr-2" />Unlock for {video.priceInSats.toLocaleString()} SAT</>}
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-red-400 text-sm mb-3">
                  You need {(video.priceInSats - Math.floor(userBalance)).toLocaleString()} more SAT
                </p>
                <Button
                  onClick={() => setLocation('/')}
                  className="bg-[#F5C542]/20 hover:bg-[#F5C542]/30 text-[#F5C542] border border-[#F5C542]/30 rounded-full px-6"
                >
                  <Zap className="w-4 h-4 mr-2" />Earn More SAT
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Info */}
      <div className="px-4 py-4">
        <h1 className="text-white font-bold text-lg leading-tight mb-1">{video.title}</h1>
        <p className="text-white/40 text-sm">{formattedViews} views</p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-4 pb-4 border-b border-white/5">
          <button
            onClick={() => reactMutation.mutate('like')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              video.userReaction === 'like'
                ? 'bg-[#F5C542]/20 text-[#F5C542] border border-[#F5C542]/30'
                : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{video.likesCount}</span>
          </button>
          <button
            onClick={() => reactMutation.mutate('dislike')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              video.userReaction === 'dislike'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
            <span>{video.dislikesCount}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{video.commentsCount}</span>
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ml-auto ${
              video.isSaved
                ? 'bg-[#F5C542]/20 text-[#F5C542] border border-[#F5C542]/30'
                : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
            }`}
          >
            {video.isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        {/* Description */}
        {video.description && (
          <div className="mt-4 p-3 bg-white/3 rounded-xl">
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{video.description}</p>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 pb-6"
          >
            <h3 className="text-white font-semibold mb-4">Comments ({video.commentsCount})</h3>

            {/* Add comment */}
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#F5C542]/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-[#F5C542]" />
              </div>
              <div className="flex-1 flex gap-2">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder-white/30 resize-none min-h-[60px] rounded-xl text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && comment.trim()) {
                      e.preventDefault();
                      commentMutation.mutate(comment);
                    }
                  }}
                />
                <button
                  onClick={() => comment.trim() && commentMutation.mutate(comment)}
                  disabled={!comment.trim() || commentMutation.isPending}
                  className="self-end p-2 bg-[#F5C542] text-black rounded-full disabled:opacity-40 hover:bg-[#F5C542]/90 transition-colors"
                >
                  {commentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Comments list */}
            {commentsData?.comments?.map((c) => (
              <div key={c.id} className="flex gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white/50" />
                </div>
                <div>
                  <p className="text-white/70 text-xs font-medium mb-1">
                    {c.firstName || c.username || 'User'}
                  </p>
                  <p className="text-white/90 text-sm leading-relaxed">{c.content}</p>
                  <p className="text-white/30 text-xs mt-1">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
