/* ══ PRACTICE-SCREEN.JSX ══
   Tab ẩn "Ôn tập riêng" cho Student — chỉ được app.jsx render khi
   practiceLessons.length > 0 (xem index/JS/app.jsx: onGoPractice chỉ có
   giá trị khi có ít nhất 1 bài, và Dashboard/TabBar tự ẩn nút khi
   onGoPractice undefined).

   Tương đương TabPractice.kt bên app Android:
   - Thẻ phẳng HyperOS
     
   - Badge số bài cạnh tiêu đề, icon sparkle
   - Trạng thái rỗng: minh hoạ + text ấm áp thay vì icon khoá lạnh lùng

   Nguồn dữ liệu: lessons đã được app.jsx lọc sẵn
   (category==='practice' && is_published), nên component này không cần
   tự lọc lại — chỉ nhận và hiển thị.

   Props: dark, lessons, loading, onPlay, onBack
*/
import React, { useMemo } from 'react';
(function () {
  try {
    const { useMemo } = React;

    const IconSparkle = ({ size = 20, color = '#1AB0F5' }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
      </svg>
    );
    const IconChevronRight = ({ size = 16, color }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    );
    const IconBack = ({ size = 20 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    );
    const EmptyBoxIllustration = ({ size = 96 }) => (
      <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
        <rect x="18" y="42" width="60" height="38" rx="8" fill="rgba(26,176,245,0.14)" />
        <path d="M18 42 L30 24 L66 24 L78 42 Z" fill="rgba(26,176,245,0.26)" />
        <line x1="48" y1="42" x2="48" y2="80" stroke="#1AB0F5" strokeWidth="1.5" opacity="0.4" />
      </svg>
    );

    function PracticeHeader({ count }) {
      return (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div className="hy-page-title">Ôn tập riêng</div>
          <span className="hy-value">{count} bài</span>
        </div>
      );
    }

    function PracticeLessonCard({ lesson, onClick }) {
      return (
        <div className="hy-row" onClick={onClick} style={{ cursor: 'pointer' }}>
          <span className="hy-ico"><IconSparkle size={20} color="#fff" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="hy-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {lesson.title || 'Bài ôn tập'}<span title={lesson.qc_passed?'Đã QC pass':'Chưa QC'} aria-label={lesson.qc_passed?'Đã QC pass':'Chưa QC'} style={{display:'inline-flex',verticalAlign:'-2px',marginLeft:6}}><svg width="15" height="15" viewBox="0 0 24 24" fill={lesson.qc_passed?'#1AB0F5':'#fff'} stroke={lesson.qc_passed?'#1AB0F5':'#B7C6CE'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M8.5 12l2.5 2.5 4.5-5" stroke={lesson.qc_passed?'#fff':'#B7C6CE'} fill="none"/></svg></span>
            </div>
            <div className="hy-sub hy-value">
              {(lesson.subject || 'Tiếng Anh')} · {lesson.questionCount ?? (lesson.questions || []).length} câu
            </div>
          </div>
          <i className="hy-chevron" />
        </div>
      );
    }

    function EmptyPracticeState() {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 10, padding: '60px 20px 20px', textAlign: 'center',
        }}>
          <EmptyBoxIllustration size={96} />
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--hy-text)' }}>
            Chưa có bài ôn tập nào
          </div>
          <div className="hy-value" style={{ fontSize: 13.5 }}>
            Bài mới sẽ hiện ở đây khi có.
          </div>
        </div>
      );
    }

    function PracticeScreen({ dark, lessons = [], loading, onPlay, onBack }) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 14px 4px', position: 'sticky', top: 0, zIndex: 60 }}>
            <button onClick={onBack} aria-label="Quay lại" className="hy-btn plain icon">
              <IconBack />
            </button>
          </div>

          <div style={{ flex: 1, padding: '0 14px 100px' }}>
            {loading && lessons.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 0' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ height: 64, borderRadius: 26, background: 'var(--hy-card)', opacity: 0.6 }} />
                ))}
              </div>
            ) : lessons.length === 0 ? (
              <EmptyPracticeState />
            ) : (
              <>
                <PracticeHeader count={lessons.length} />
                <div className="hy-card flush" style={{ padding: '0 20px' }}>
                  {lessons.map((lesson) => (
                    <PracticeLessonCard key={lesson.id} lesson={lesson} onClick={() => onPlay(lesson)} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    window.PracticeScreen = PracticeScreen;
  } catch (e) {
    console.error('[practice-screen] INIT ERROR:', e);
  }
})();
