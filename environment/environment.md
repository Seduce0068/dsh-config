## OS / Kernel
Ubuntu 26.04.1 LTS
kernel: 7.0.0-43-generic
arch: x86_64

## Hardware

total        used        free      shared  buff/cache   available
Mem:            62Gi        40Gi       1.9Gi       740Mi        21Gi        22Gi
Swap:           63Gi       4.0Ki        63Gi
NVIDIA GeForce GTX 1660 SUPER, 595.99.02, 6144 MiB

## Versions
dsh: 0.2.2-rc.1
node: v24.22.2
pnpm: 12.18.0
rustc: rustc 1.99.1 (58cf8f9c3 2026-10-13)
cargo: cargo 1.99.1 (5f94df478 2026-08-27)
python3: Python 3.14.4
tailscale: 1.104.5
git: git version 2.53.0

## Storage
NAME          SIZE FSTYPE MOUNTPOINT
sda         931.5G        
└─sda1      931.5G ntfs   
sdb         447.1G        
└─sdb1      447.1G ext4   /mnt/timeshift
nvme0n1     931.5G        
├─nvme0n1p1   450M ntfs   
├─nvme0n1p2   100M vfat   /boot/efi
├─nvme0n1p3    16M        
├─nvme0n1p4 333.3G ntfs   
├─nvme0n1p5   826M ntfs   
└─nvme0n1p7 596.9G ext4   /
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p7  587G  445G  113G  80% /
/dev/sdb1       440G  127G  309G  30% /mnt/timeshift

## Network (sanitized)
default via <private-ip> dev enp4s0 proto dhcp src <private-ip> metric 100 
10.0.3.0/24 dev lxcbr0 proto kernel scope link src 10.0.3.1 linkdown 
172.17.0.0/16 dev docker0 proto kernel scope link src 172.17.0.1 linkdown 
172.18.0.0/16 dev br-19b60f1f19dc proto kernel scope link src 172.18.0.1 linkdown 
172.19.0.0/16 dev br-9a7ce1e92d28 proto kernel scope link src 172.19.0.1 linkdown
State  Recv-Q Send-Q                          Local Address:Port  Peer Address:PortProcess                                   
LISTEN 0      128                                 127.0.0.1:50052      0.0.0.0:*    users:(("jarvis-mcp-gw",pid=5356,fd=9))  
LISTEN 0      128                                 127.0.0.1:50053      0.0.0.0:*    users:(("jarvis-event",pid=5361,fd=11))  
LISTEN 0      128                                 127.0.0.1:50054      0.0.0.0:*    users:(("jarvis-context",pid=5344,fd=11))
LISTEN 0      128                                 127.0.0.1:50051      0.0.0.0:*    users:(("jarvis-policy",pid=5350,fd=9))  
LISTEN 0      4096                 <TAILNET_IP>%tailscale0:8443       0.0.0.0:*                                             
LISTEN 0      4096                 <TAILNET_IP>%tailscale0:8445       0.0.0.0:*                                             
LISTEN 0      512                                 127.0.0.1:49374      0.0.0.0:*    users:(("opencode",pid=6109,fd=8))       
LISTEN 0      512                                 127.0.0.1:49375      0.0.0.0:*    users:(("opencode",pid=1677,fd=8))       
LISTEN 0      4096                 <TAILNET_IP>%tailscale0:42914      0.0.0.0:*                                             
LISTEN 0      4096                                127.0.0.1:18888      0.0.0.0:*    users:(("caddy",pid=3281,fd=8))          
LISTEN 0      4096                                127.0.0.1:18889      0.0.0.0:*    users:(("caddy",pid=3281,fd=4))          
LISTEN 0      4096                                127.0.0.1:18890      0.0.0.0:*    users:(("caddy",pid=3281,fd=7))          
LISTEN 0      511                                 127.0.0.1:18789      0.0.0.0:*    users:(("MainThread",pid=2780,fd=27))    
LISTEN 0      4096                                127.0.0.1:18554      0.0.0.0:*                                             
LISTEN 0      32                              <private-ip>:53         0.0.0.0:*                                             
LISTEN 0      4096                 <TAILNET_IP>%tailscale0:443        0.0.0.0:*                                             
LISTEN 0      4096                               127.0.0.54:53         0.0.0.0:*                                             
LISTEN 0      4096                                127.0.0.1:631        0.0.0.0:*                                             
LISTEN 0      4096                            127.0.0.53%lo:53         0.0.0.0:*                                             
LISTEN 0      511                                 127.0.0.1:32973      0.0.0.0:*    users:(("code",pid=49952,fd=62))         
LISTEN 0      511                                 127.0.0.1:34671      0.0.0.0:*    users:(("code",pid=33357,fd=42))         
LISTEN 0      4096                                127.0.0.1:34063      0.0.0.0:*                                             
LISTEN 0      5                                   127.0.0.1:1081       0.0.0.0:*    users:(("adguard-cli",pid=4955,fd=73))   
LISTEN 0      511                                 127.0.0.1:36391      0.0.0.0:*    users:(("code",pid=49952,fd=54))
