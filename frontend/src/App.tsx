import { useEffect, useState } from 'react';
import { Landing } from './components/Landing';
import { Workspace } from './components/Workspace/Workspace';

export function App(){
  const pageForPath=()=>location.pathname.startsWith('/workspace')?'workspace':'landing';
  const [page,setPage]=useState(pageForPath);
  useEffect(()=>{
    const sync=()=>setPage(pageForPath());
    addEventListener('popstate',sync);
    return ()=>removeEventListener('popstate',sync);
  },[]);
  const navigate=(path:'/'|'/workspace')=>{
    history.pushState({},'',path);
    setPage(path==='/'?'landing':'workspace');
    window.scrollTo(0,0);
  };
  return page==='workspace'?<Workspace goHome={()=>navigate('/')}/>:<Landing enter={()=>navigate('/workspace')}/>;
}
