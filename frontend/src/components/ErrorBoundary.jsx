import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false, error:null }; }
  static getDerivedStateFromError(error){ return { hasError:true, error }; }
  componentDidCatch(error, info){ console.error('ErrorBoundary:', error, info); }
  render(){
    if(this.state.hasError){
      return (
        <div className="p-6 m-6 border border-red-300 bg-red-50 rounded">
          <h2 className="text-red-700 font-semibold mb-2">Algo deu errado nesta tela.</h2>
          <pre className="text-xs text-red-700 whitespace-pre-wrap">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
