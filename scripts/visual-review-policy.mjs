export function hasHumanApproval(reviews, head) {
 const votes=new Map();
 for(const review of reviews) {
  if(review.user?.type==='User' && ['OWNER','MEMBER','COLLABORATOR'].includes(review.author_association) && ['APPROVED','CHANGES_REQUESTED','DISMISSED'].includes(review.state)) votes.set(review.user.login,review);
 }
 return [...votes.values()].some(r=>r.state==='APPROVED' && r.commit_id===head);
}
