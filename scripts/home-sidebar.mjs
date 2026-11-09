const icons={
 people:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-16a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v2"/>',
 news:'<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M7 8h10M7 12h4m3 0h3M7 16h10"/>',
 projects:'<rect x="3" y="7" width="18" height="14" rx="1"/><path d="M8 7V3h8v4M3 12h18M10 12v3h4v-3"/>',
 ideas:'<path d="M8 16c0-3-3-4-3-8a7 7 0 0 1 14 0c0 4-3 5-3 8ZM9 19h6m-5 3h4"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M7 2v6m10-6v6M3 11h18m-14 4h3m4 0h3"/>',
 media:'<rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="8" cy="9" r="2"/><path d="m3 18 6-5 4 3 4-5 4 7"/>',
 voices:'<path d="M21 11a9 8 0 0 1-9 8H8l-5 3 1-6a8 8 0 0 1-1-5 9 8 0 0 1 18 0Z"/><path d="M7 9h10M7 13h7"/>'
};
const items=[
 ['Get Involved','people',[['get-involved.html','Explore opportunities'],['get-involved.html#application','Apply to get involved']]],
 ['Share Your Ideas','ideas',[['contact.html#message-heading','Send your ideas']]],
 ['Our Projects','projects',[['projects.html#project-initiatives-heading','Explore our projects']]],
 ['Latest News','news',null,'Ask about updates'],
 ['Events & Activities','calendar',null,'Ask about activities'],
 ['Media Gallery','media',null,'Contact our team'],
 ['Community Voices','voices',null,'Share your voice']
];
export function renderHomeSidebar(){
 return `<aside id="desktop-quick-links" class="home-sidebar" aria-label="Homepage quick links">${items.map(([label,icon,links,contactLabel])=>`<details class="home-sidebar-item" name="home-sidebar"><summary><svg class="home-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[icon]}</svg><span>${label}</span><svg class="home-sidebar-arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false"><path d="m2 4 4 4 4-4"/></svg></summary><nav class="home-sidebar-links" aria-label="${label}">${links?links.map(([href,text])=>`<a href="${href}">${text}</a>`).join(''):`<p>No published items available.</p><a href="contact.html#message-heading">${contactLabel}</a>`}</nav></details>`).join('')}</aside>`;
}
