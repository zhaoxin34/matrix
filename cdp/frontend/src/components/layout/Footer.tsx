import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer
      style={{
        height: 120,
        background: '#f5f5f5',
        borderTop: '1px solid #e8e8e8',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 16, color: '#666' }}>
          <Link to="/about">关于我们</Link>
          <Link to="/contact">联系我们</Link>
          <Link to="/privacy">隐私政策</Link>
          <Link to="/terms">服务条款</Link>
        </div>
        <div style={{ color: '#999', fontSize: 12 }}>© 2024 CDP平台. All rights reserved.</div>
      </div>
    </footer>
  );
}
