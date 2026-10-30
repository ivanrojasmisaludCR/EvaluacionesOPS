// A real child process for lifecycle tests. No Cloudflare connection is made.
const host=process.argv[2];
if(host==='api-error'){process.stderr.write('failed to request quick Tunnel: Post "https://api.trycloudflare.com/tunnel": TLS error\n');process.exit(1);}
process.stderr.write('Starting tunnel\nhttps://'+host.slice(0,5));
setTimeout(()=>process.stderr.write(host.slice(5)+'\n'),10);
const timer=setInterval(()=>{},1000);
process.on('SIGTERM',()=>{clearInterval(timer);process.exit(0);});
