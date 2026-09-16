(() => {
  function addBookingsNav(){
    if(document.querySelector('.sidebar a[href="bookings.html"]')) return;
    const sections=[...document.querySelectorAll('.sidebar-section')];
    let ops=sections.find(s=>['Admin','Finance','Operations'].includes(s.querySelector('.sidebar-label')?.textContent?.trim()));
    if(!ops){
      ops=document.createElement('div');
      ops.className='sidebar-section admin-only';
      ops.innerHTML='<div class="sidebar-label">Operations</div>';
      document.querySelector('.sidebar')?.appendChild(ops);
    }
    const link=document.createElement('a');
    link.className='nav-link sidebar-link admin-only';
    link.href='bookings.html';
    link.textContent='Bookings';
    const social=ops.querySelector('a[href="social.html"]');
    social ? ops.insertBefore(link,social) : ops.appendChild(link);
    const page=window.location.pathname.split('/').pop()||'dashboard.html';
    if(page==='bookings.html') link.classList.add('active');
  }
  window.addEventListener('DOMContentLoaded',()=>setTimeout(addBookingsNav,100));
})();
