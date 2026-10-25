export type BlogPost = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  category: string;
  date: string;
  author: string;
  excerpt: string;
  content: string;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-program-merlin-garage-door-remote",
    title: "How to Program a Merlin Garage Door Remote (Step-by-Step Guide)",
    metaTitle: "How to Program a Merlin Garage Door Remote | Step-by-Step Guide",
    metaDescription:
      "Learn how to program your Merlin garage door remote in under 5 minutes. Step-by-step instructions for Merlin E960M, E970M, E964M, E8003 and Merlin+ models. No technician required.",
    keywords: [
      "how to program merlin garage door remote",
      "merlin remote programming",
      "merlin e960m programming",
      "merlin e970m setup",
      "program merlin remote",
      "merlin garage door remote instructions",
    ],
    category: "Programming Guides",
    date: "2026-09-01",
    author: "ALLREMOTES Support Team",
    excerpt:
      "Lost your Merlin garage door remote or need a spare? Programming a replacement Merlin remote is simpler than you think. Follow our step-by-step guide for all major Merlin models.",
    content: `
## What You'll Need

- Your new replacement Merlin remote
- A step ladder (to access your garage door motor)
- 2 minutes of your time

## Step 1: Locate the Learn Button on Your Motor

Open your garage door motor unit — it's the box mounted on the ceiling of your garage. Look for a small button on the motor housing. On Merlin motors, this is usually labelled **"Learn"** or **"Code"** and may have a small LED next to it.

The button is typically:
- **Merlin ProLift / SilentDrive**: Small black or red button on the back or side of the motor
- **Merlin Commander**: Button behind a small cover panel on the front
- **Merlin+ (E960M, E970M, E964M)**: Button on the front panel, sometimes under a flip-down cover

## Step 2: Clear Existing Codes (Optional)

If you're setting up a new remote because you lost the old one, it's a good idea to clear the motor's memory first:

1. Press and hold the **Learn** button for **6-10 seconds** until the LED flashes or you hear a beep
2. This erases all previously paired remotes
3. You'll need to re-pair any remotes you still want to use

**Skip this step** if you're just adding a spare remote to an existing setup.

## Step 3: Pair Your New Remote

1. Press the **Learn** button once (don't hold it — just a short press)
2. The LED on the motor will start **flashing** or light up solid
3. Within **15 seconds**, press and hold the button you want to use on your new remote
4. Hold it for **2-3 seconds**
5. The motor LED will flash or you'll hear a click — this means the remote is now paired
6. Test the remote by pressing the button — your garage door should respond

## Step 4: Test All Buttons

If your remote has multiple buttons (2-button or 4-button models), repeat Step 3 for each button you want to program. Each button can control a different door or function.

## Model-Specific Notes

### Merlin E960M / E970M (433MHz, 4-Button)
These are the most common Merlin remotes in Australia. They operate on 433MHz and use a rolling code system. The pairing process is the same as above — press Learn, then press the remote button.

Need a replacement? We stock the [Merlin E960M remote](/product/merlin-e960m-434mhz-4button-remote-ar-rcmp7-65549084-f09c-4f5f-bb44-4ed33127163d) and the [Merlin E970M remote](/product/merlin-e970m-434mhz-4button-remote-ar-rcmp11-1e6aff99-75f5-4aa9-b3f8-3484a4d78cb4) — both pre-tested and backed by our 12-month warranty.

### Merlin E964M (433MHz, 4-Button)
Similar to the E960M but with a different button layout. Same programming process.

### Merlin E8003
Older model — the Learn button may be larger and red. The process is identical.

### Merlin+ 2.0
Newer motors may have a **wireless learn** feature. Check your motor's manual — some models allow pairing via the wall button panel instead of the motor unit.

## Troubleshooting

**Remote won't pair?**
- Make sure you're pressing the Learn button (not the wall button)
- Check that you're within 15 seconds of pressing Learn — if the LED stops flashing, start again
- Try a fresh battery in the remote (CR2032 or 12V 27A depending on model)
- Make sure you're using the correct frequency — Merlin remotes in Australia are 433MHz

**Door opens but won't close?**
- Check the safety beam sensors at the bottom of the door — they must be aligned and unobstructed
- The remote may need to be held longer during pairing

**Remote works intermittently?**
- Replace the battery
- Check for interference from other 433MHz devices nearby

## Need Help?

If you're still having trouble, contact our support team at **shane@allremotes.com.au** — we can help you identify the right remote and walk you through programming over the phone.

Browse our full range of [Merlin replacement remotes](/brands/Merlin) to find the right one for your motor — or go straight to the [E960M](/product/merlin-e960m-434mhz-4button-remote-ar-rcmp7-65549084-f09c-4f5f-bb44-4ed33127163d) and [E970M](/product/merlin-e970m-434mhz-4button-remote-ar-rcmp11-1e6aff99-75f5-4aa9-b3f8-3484a4d78cb4), the two models most Merlin owners need.
    `,
  },
  {
    slug: "how-to-program-ata-remote",
    title: "How to Program an ATA Remote: PTX4, PTX5, PTX6 Guide",
    metaTitle: "How to Program an ATA Remote (PTX4, PTX5, PTX6) | Step-by-Step",
    metaDescription:
      "Complete guide to programming ATA garage door remotes. Step-by-step instructions for ATA PTX4, PTX5, and PTX6 SecuraCode remotes. Pair your replacement remote in minutes.",
    keywords: [
      "how to program ata remote",
      "ata ptx4 programming",
      "ata ptx5 setup",
      "ata ptx6 remote instructions",
      "ata securacode remote",
      "program ata garage remote",
    ],
    category: "Programming Guides",
    date: "2026-09-01",
    author: "ALLREMOTES Support Team",
    excerpt:
      "ATA remotes use rolling code technology (SecuraCode) for enhanced security. Here's how to program ATA PTX4, PTX5, and PTX6 replacement remotes to your garage door opener.",
    content: `
## What You'll Need

- Your new ATA replacement remote (PTX4, PTX5, or PTX6)
- Access to your garage door motor
- 2 minutes

## Understanding ATA SecuraCode

ATA (Automatic Technology Australia) remotes use **SecuraCode** rolling code technology. Each time you press the button, a new code is generated — this prevents code grabbing and replay attacks. The pairing process teaches your motor to recognise your remote's unique code sequence.

## Step 1: Find the Learn Button

On ATA motors, the Learn button is usually:
- **PTX4-compatible motors**: Small button on the motor head, often marked with a code symbol
- **PTX5-compatible motors**: Button on the side or back of the motor unit
- **PTX6-compatible motors**: Similar location, may be under a rubber cover

The button is typically **black or red** and about the size of a pencil eraser.

## Step 2: Press the Learn Button

1. Press the **Learn/Code** button once
2. The motor's LED will illuminate or start flashing
3. You now have approximately **10 seconds** to pair your remote

## Step 3: Program the Remote

1. Press and **hold** the desired button on your ATA remote
2. Keep holding for **2-3 seconds**
3. The motor LED will flash rapidly or you'll hear a click
4. Release the button
5. Press the button again to test — the door should activate

## Step 4: Program Additional Buttons

For multi-button remotes (PTX4 has 4 buttons, PTX5 has 3-4, PTX6 has 4):

1. Press Learn again
2. Press and hold a different button
3. Repeat for each button you want to program

Each button can control a different door or function.

## Model-Specific Instructions

### ATA PTX4 (SecuraCode, 4-Button)
The most popular ATA remote. Operates on 433.92MHz with rolling code. Programming is straightforward — Learn button on motor, then press remote button.

We stock the [ATA PTX4 replacement remote](/product/ata-ptx4-434mhz-4button-remote-ar-rcg12p-2fb3ed04-7472-4dc7-9576-61fb63dd7877) with step-by-step instructions included.

### ATA PTX5 (TrioCode, 4-Button)
The PTX5 uses **TrioCode** technology which operates on **three frequencies** (433.92MHz, 915MHz, and another) for improved reliability in areas with interference. The programming process is the same as PTX4.

### ATA PTX6 (SecuraCode, 4-Button)
Similar to PTX4 but with a different form factor. Same rolling code technology and programming method.

## Clearing All Remotes

If you've lost a remote and want to start fresh:

1. Press and **hold** the Learn button for **8-10 seconds**
2. The LED will flash rapidly then go out
3. All remotes are now erased from the motor's memory
4. Re-pair each remote you want to keep

## Troubleshooting

**Remote won't pair after multiple attempts?**
- Check the battery — ATA remotes use **CR2032** (PTX4) or **12V 27A** (PTX5/PTX6) batteries
- Make sure you're using the correct remote for your motor — PTX4 and PTX5 are **not interchangeable** despite looking similar
- Stand closer to the motor during pairing (within 2 metres)

**Door responds to wall button but not remote?**
- The remote battery is likely flat — replace and try again
- If a new battery doesn't fix it, the remote may be faulty — contact us for a warranty replacement

**One button works but others don't?**
- Each button needs to be programmed separately
- Press Learn, then press and hold the unprogrammed button

## Need Help?

Contact us at **shane@allremotes.com.au** or browse our [ATA replacement remotes](/brands/ATA) — including the popular [PTX4 replacement](/product/ata-ptx4-434mhz-4button-remote-ar-rcg12p-2fb3ed04-7472-4dc7-9576-61fb63dd7877).

## Safety Note

Always keep garage door remotes out of reach of children. The button battery in ATA remotes can be dangerous if swallowed. Ensure the battery compartment is secured.
    `,
  },
  {
    slug: "garage-door-remote-not-working",
    title: "Garage Door Remote Not Working? 7 Fixes to Try",
    metaTitle: "Garage Door Remote Not Working? 7 Fixes to Try | ALLREMOTES",
    metaDescription:
      "Garage door remote stopped working? Try these 7 troubleshooting fixes before calling a technician. Covers battery, interference, motor reset, and remote replacement.",
    keywords: [
      "garage door remote not working",
      "garage remote troubleshooting",
      "garage door remote fix",
      "remote stopped working",
      "garage door remote repair",
    ],
    category: "Troubleshooting",
    date: "2026-09-01",
    author: "ALLREMOTES Support Team",
    excerpt:
      "Before you call a technician or buy a new motor, try these 7 simple fixes. Most garage door remote problems can be solved in under 5 minutes.",
    content: `
## Fix 1: Replace the Battery

This is the #1 cause of remote failure — and the easiest to fix.

**What battery does your remote use?**
- **Merlin E960M / E970M / E964M**: CR2032 (coin cell)
- **ATA PTX4**: CR2032 (coin cell)
- **ATA PTX5 / PTX6**: 12V 27A (small cylinder)
- **B&D TriTran**: CR2032 or 12V 27A (check your model)
- **Most 433MHz gate remotes**: 12V 27A

Batteries cost $3-5 from any supermarket or electronics store. Try this first — it solves the problem 70% of the time.

## Fix 2: Check for Interference

If your remote works sometimes but not others, you may have **433MHz interference** from:
- Baby monitors
- Wireless doorbells
- Nearby radio towers
- LED light fixtures (some emit RF noise)
- Neighbours' garage door remotes

**How to test:** Try operating the door from directly underneath the motor. If it works up close but not from further away, interference is likely the cause.

**The fix:** If you have an ATA PTX5 (TrioCode), it already uses multiple frequencies to avoid this. For other remotes, you may need to relocate the motor's antenna wire so it hangs straight down (not coiled up inside the motor housing).

## Fix 3: Reprogram the Remote

Sometimes the rolling code gets out of sync. Reprogramming is quick:

1. Press the **Learn** button on your motor
2. Press and hold a button on your remote for 2-3 seconds
3. Test

See our [Merlin programming guide](/blog/how-to-program-merlin-garage-door-remote) or [ATA programming guide](/blog/how-to-program-ata-remote) for detailed instructions.

## Fix 4: Check the Safety Beam Sensors

If your remote opens the door but **won't close it**, the safety beam sensors at the bottom of the door may be:
- Misaligned (knocked by a broom, bike, or foot)
- Dirty (wipe the lenses with a clean cloth)
- Blocked (something in the path)

The motor will refuse to close the door if the beams aren't clear. Check the LED on each sensor — both should be solid, not flashing.

## Fix 5: Power Cycle the Motor

Just like a computer, sometimes a garage door motor just needs a restart:

1. Switch off the power to the motor at the wall switch or circuit breaker
2. Wait **30 seconds**
3. Switch it back on
4. Wait for the motor to initialise (usually 5-10 seconds)
5. Test your remote

This clears temporary glitches in the motor's memory without erasing your paired remotes.

## Fix 6: Check the Wall Button

If the wall button inside your garage works but the remote doesn't:
- **Remote issue**: Battery, reprogramming, or remote is faulty
- **Not a motor issue**: The motor is working fine if the wall button activates it

If **neither** the wall button nor the remote works:
- Check the power supply to the motor
- Check for a blown fuse or tripped breaker
- The motor's internal circuit board may have failed — call a technician

## Fix 7: Replace the Remote

If you've tried all the above and the remote still doesn't work, it may be dead. Common signs:
- No LED light when you press a button (even with a fresh battery)
- Remote is physically damaged (cracked case, water damage)
- Remote is more than 5-7 years old (electronics degrade over time)

The good news: replacement remotes are affordable ($25-45) and easy to program yourself. Popular direct replacements include the [Merlin E960M](/product/merlin-e960m-434mhz-4button-remote-ar-rcmp7-65549084-f09c-4f5f-bb44-4ed33127163d) and the [ATA PTX4](/product/ata-ptx4-434mhz-4button-remote-ar-rcg12p-2fb3ed04-7472-4dc7-9576-61fb63dd7877).

Browse our full range of [replacement garage door remotes](/products/garage) — we stock compatible replacements for [Merlin](/brands/Merlin), [ATA](/brands/ATA), [B&D](/brands/B%26D), [Chamberlain](/brands/Chamberlain), [Gliderol](/brands/Gliderol) and more.

## When to Call a Technician

Call a professional if:
- The motor makes grinding or clicking noises
- The door moves unevenly or jerks
- The motor runs but the door doesn't move (spring or chain issue)
- You smell burning from the motor unit

These are mechanical issues, not remote issues — a new remote won't fix them.

## Need Help Finding the Right Remote?

If you're not sure which remote you need, [check our compatibility guide](/support/which-garage-door-remote-do-i-need) or email us at **shane@allremotes.com.au** with a photo of your existing remote or motor label — we'll identify the right replacement for you.
    `,
  },
  {
    slug: "4d-doors-remote-programming-replacement",
    title: "4D Doors Remote: Replacement & Programming Guide (RC01, R4D1, R4D2)",
    metaTitle: "4D Doors Remote Programming & Replacement Guide | RC01, R4D1, R4D2",
    metaDescription:
      "Lost or broken 4D Doors remote? Official programming steps for RC01, R4D1 and R4D2 remotes on 4DS2 and GA103 motors — plus the correct replacements to buy in Australia.",
    keywords: [
      "4d doors remote",
      "4d doors remote programming",
      "4d doors remote replacement",
      "4ddoors remote",
      "4d garage door remote",
      "rc01 remote programming",
    ],
    category: "Programming Guides",
    date: "2026-10-26",
    author: "ALLREMOTES Support Team",
    excerpt:
      "4D Doors remotes pair in under a minute once you know the Code button sequence. Here's the official procedure — and which replacement remote your motor needs.",
    content: `
## Which 4D Doors Remote Do You Have?

4D Doors motors are common on sectional and tilt doors across Australia. The three remotes you'll see most often:

- **RC01** — 433MHz 4-button remote, standard on the **4DS2** motor and GA103 receiver setups
- **R4D2** — 2-button remote used on several 4D openers
- **R4D1** — earlier 4-button remote

Not sure? The model number is printed inside the battery cover. We stock genuine [4D Doors RC01 remotes](/product/4d-doors-rc01-433mhz-4button-remote-ar-rc01-e3f7c7cf-f649-4331-a02c-35a434b9994c), the [4D Doors R4D2](/product/4d-doors-r4d2-remote-control-ar-r4d2-f6d42fe8-5ebe-4148-bada-b2f12d9ae357) and the [4D Doors R4D1](/product/4d-doors-r4d1-remote-control-ar-r4d1-ee8a7050-0884-4fd9-a206-a26c698c6f40).

## Programming a New Remote — 4DS2 Motor (Official Steps)

1. Open the motor cover (lid) to expose the control panel
2. Press and release the **Code** button **once** — the red dot in the corner of the display lights up
3. Press and release the button on your **new remote** — the red dot turns off
4. Press and release the **same remote button again** — the red dot and motor LED will flash
5. Test the remote — the door should now respond

## Programming to a GA103 Receiver (c1 button)

Some 4D installations use a separate GA103 receiver board instead of the motor's panel:

1. Press the **c1** button once on the receiver board — the blue LED flashes
2. Press the button on the remote you want to program
3. Release — the remote is paired
4. Test operation

## Deleting All Remotes

Lost a remote? Wipe the motor memory so it can't be used:

- **4DS2 motor**: press and **hold** the Code button until **C** shows on the display — all stored remotes are deleted. Re-pair any remotes you want to keep.
- **GA103 receiver**: press and hold **c1** for ~10 seconds until the blue LED flashes.

## Troubleshooting

- **Red dot doesn't light?** You're pressing the wrong button — look for the button labelled "Code" (not the door-operate or light buttons)
- **Remote won't pair?** Fresh battery first (most 4D remotes use a **12V 27A** battery), then retry within a metre of the motor
- **Paired but door doesn't move?** Check the manual release hasn't been pulled and the door isn't locked

## Need Help?

Email **shane@allremotes.com.au** with a photo of your remote or motor label and we'll confirm the right replacement — or browse all [garage & gate remotes](/products/garage).
    `,
  },
  {
    slug: "garage-remote-frequencies-explained",
    title: "Garage Remote Frequencies Explained: 27, 92, 315, 390, 433, 434 & 868MHz",
    metaTitle: "Garage Door Remote Frequencies Explained (390/433/434/868MHz) | Australia",
    metaDescription:
      "What frequency is your garage remote? Guide to 27MHz, 92MHz, 315MHz, 390MHz, 433MHz, 434MHz and 868MHz remotes in Australia — which brands use which, and why it matters.",
    keywords: [
      "433mhz remote",
      "434mhz remote",
      "390mhz garage door remote",
      "868mhz garage door remote",
      "433.92mhz remote",
      "garage remote frequency",
      "315mhz remote",
      "27mhz remote",
    ],
    category: "Buying Guides",
    date: "2026-10-26",
    author: "ALLREMOTES Support Team",
    excerpt:
      "Buying a replacement garage remote? Getting the frequency wrong means it will never pair — even if it looks identical. Here's how to check yours in 30 seconds.",
    content: `
## Why Frequency Matters

A replacement remote must transmit on the **same frequency** as your motor's receiver — a 433MHz remote cannot pair with a 390MHz motor, no matter how similar they look. Frequency is the #1 reason "compatible-looking" remotes fail to program.

## How to Find Your Remote's Frequency

1. **Check the battery cover** — most remotes print the frequency inside the battery compartment or on the back sticker
2. **Check the motor label** — the receiver spec is often on the motor housing
3. **Google your remote model** — the model code (e.g. "TM390", "PTX4") usually resolves to a spec sheet
4. **Still stuck?** Email us a photo of the remote — we identify dozens a week at **shane@allremotes.com.au**

## The Australian Frequency Cheat-Sheet

| Frequency | Common on |
|---|---|
| **27MHz** | Very old openers — Gliderol TM27 and similar 1980s-90s motors |
| **92MHz** | B&D 4335E series, Merlin/Grifco older units, Nice ON series, some Dominator |
| **304/310/315MHz** | Gliderol TM305C (315MHz), Steel-line/Boss BHT4 (304MHz), older American-style imports |
| **318MHz** | B&D MPC2 / MPC3 remotes |
| **390MHz** | **Gliderol TM390** — distinctive frequency, almost nothing else uses it |
| **433/433.92/434MHz** | The modern standard — Merlin, ATA, B&D TriTran, FAAC, BFT, Nice, DEA, most universal remotes |
| **868MHz** | Some DEA and European gate systems (GTI/868 variants) |
| **915MHz+** | ATA PTX5 TrioCode uses multiple frequencies including 915MHz band |

## "433MHz" vs "433.92MHz" vs "434MHz" — Are They the Same?

**Effectively yes.** These are the same ISM band; manufacturers and resellers round differently. A remote labelled 433MHz, 433.92MHz or 434MHz operates on the same channel and they are interchangeable with each other — but **not** with 390MHz or 315MHz.

## Frequency ≠ Coding

Even at the right frequency, the remote must speak the right **code** — fixed code, rolling code (SecuraCode, TriTran, HCS) or brand-specific protocols. That's why "universal" remotes only work on listed systems. Genuine or quality aftermarket replacements matched to your model are far more reliable.

## Common Replacements by Frequency

- **390MHz**: [Gliderol TM390 remote](/product/gliderol-tm390-390mhz-3button-remote-ar-rcg50-0399b641-0188-4882-ad1b-5bbce10152be)
- **315MHz**: [Gliderol TM305C remote](/product/gliderol-tm305c-315mhz-3button-remote-ar-rcg01-b9443921-6567-4ca7-a2b0-7b3222e152d1)
- **433/434MHz**: covers most of our range — see [all garage remotes](/products/garage) or jump to [Merlin](/brands/Merlin), [ATA](/brands/ATA), [B&D](/brands/B%26D), [FAAC](/brands/FAAC)

## Quick Rule

Same frequency + same code system + a "Learn" button on your motor = almost always a 2-minute DIY pairing. Wrong frequency = will never work, return it.
    `,
  },
  {
    slug: "dea-remote-programming-guide",
    title: "DEA Remote Programming Guide: GTI, GTX, Ziggy & Mhouse Remotes",
    metaTitle: "DEA Remote Programming Guide (GTI, GTX, Ziggy, Mhouse) | ALLREMOTES",
    metaDescription:
      "How to program DEA GTI, GTX, Ziggy and Mhouse gate remotes. Rolling code vs D.A.R.T. vs cloning explained, plus the right replacement for your DEA gate or garage opener.",
    keywords: [
      "dea gtx",
      "dea remote programming",
      "dea gti remote",
      "dea ziggy remote",
      "dea gate remote",
      "mhouse gtx4",
      "mhouse remote",
    ],
    category: "Programming Guides",
    date: "2026-10-26",
    author: "ALLREMOTES Support Team",
    excerpt:
      "DEA gate remotes program through the receiver, not the motor panel — and some models can clone an existing remote without touching the gate at all.",
    content: `
## Know Your DEA Remote First

DEA System (Italy) remotes fall into a few families — the programming method depends on which you have:

- **GTI series** (GTI2/GTI4, GTI2B/GTI4B) — 433.92MHz, supports rolling code, fixed (HT12) and D.A.R.T.
- **GTX series** (GTX2/GTX4) — the newer replacement for GTI
- **Ziggy** — popular DEA-compatible 4-button
- **Mhouse GTX4** — Mhouse is a DEA-group brand; GTX4 uses the same receiver logic

Check the LED flash when you press a button — it tells you the code mode:

- **Red LED** — HCS rolling code (factory default)
- **Green LED** — fixed code (HT12 dip-switch style)
- **Alternating red/green** — D.A.R.T. (DEA Advanced Rolling Transmission)
- **Flashing green** — cloned signal (GTI2M/GTI4M only)

## Method 1: Program via the Receiver (most common)

You'll need physical access to the gate/garage control board:

1. Open the control unit — look for the receiver card (often a small plug-in module)
2. Briefly press the **programming/learn button** on the receiver
3. The receiver LED lights or flashes to show it's in learn mode
4. Press the button on your **new remote** you want to use
5. The LED confirms storage — test the remote

To program a second door/gate, repeat using a different remote button.

## Method 2: Clone an Existing Remote (GTI2M/GTI4M only)

If your receiver is locked or in a shared complex, the "M" (memory/clonable) variants can copy a working remote's signal:

1. On the new remote, press and hold the button (T) you want to program, then press any second button on the same remote
2. After ~10 seconds the remote's LEDs light — release the second button, keep holding T
3. LEDs flash rapidly — bring the **working remote** close
4. Press the button on the working remote you want to duplicate
5. The new remote stores the signal — test it

> Note: cloning copies the code — if the original was rolling-code, only compatible receiver setups will accept the clone.

## Changing the Code Type (if pairing fails)

The remote may be in the wrong transmission mode. To cycle code types:

1. Hold **T1 + T2** together until the LEDs turn on (~10s)
2. Keep holding T1 — tap T2 to cycle: 1 flash = HCS rolling, 2 = HT12 fixed, 3 = D.A.R.T.
3. Hold T2 ~5s until LEDs switch off to save

## Which Replacement Do You Need?

- DEA GTX2B → [DEA GTX2B 434MHz remote](/product/dea-gtx2b-434mhz-2button-remote-ar-reax02-d76c2fd3-8b74-4319-9f44-611c10376373)
- DEA GTX4B → [4-button GTX4B remote](/product/4button-dea-gtx4b-garage-door-opener-remote-ar-zigx4w-4455249c-f21b-4d62-a26c-74258ddaa189)
- DEA GTI2B → [DEA GTI2B 434MHz remote](/product/dea-gti2b-434mhz-2button-remote-ar-rea02-04ebc196-f882-493f-8cf7-6c977d392879)
- DEA Ziggy → [DEA Ziggy remote](/product/dea-ziggy-garage-gate-remote-ar-zig-rb-6ca712f2-18d0-4e34-9ea5-ed40144a9825)
- Mhouse GTX4 → [Mhouse GTX4 remote](/product/mhouse-gtx4-garage-gate-remote-ar-gtds-rb-764b15a4-1161-4110-86e6-428ff67f410e)

## Troubleshooting

- **Receiver button not responding?** Some receivers need the button held 1-2 seconds, not tapped
- **Apartment/shared gate?** The receiver may be locked by the body corporate — use the cloning method or ask the strata
- **Remote pairs but range is poor?** The receiver antenna wire should hang straight and uncoiled

Questions? Email **shane@allremotes.com.au** with a photo of your remote and motor/receiver.
    `,
  },
  {
    slug: "garage-remote-battery-sizes-guide",
    title: "Garage Remote & Watch Battery Sizes Explained: CR2032, 23A, 27A, LR44 & Silver Oxide",
    metaTitle: "Remote & Watch Battery Size Guide (2032, 23A, 27A, LR44, 321, 377)",
    metaDescription:
      "Which battery does your garage remote or watch need? CR2032 vs 23A vs 27A vs LR44 vs silver oxide 321/377 — sizes, equivalents and where to buy in Australia.",
    keywords: [
      "garage remote battery",
      "cr2032 battery",
      "27a battery",
      "23a battery",
      "321 battery",
      "377 battery",
      "616 battery",
      "626 battery",
      "lr44 battery",
      "2032 battery maxell",
    ],
    category: "Buying Guides",
    date: "2026-10-26",
    author: "ALLREMOTES Support Team",
    excerpt:
      "A dead battery causes 70% of 'broken' remotes. Match the code on your old battery to this table and you'll have the right replacement in your hand for under $5.",
    content: `
## First Step: Read the Old Battery

The replacement code is stamped on the battery itself — a flat remote is almost always fixed by matching that code. If the old battery is missing, check the compartment: many remotes print the battery type inside.

## The Common Sizes

### 12V Alkaline (small cylinder — most garage remotes)

| Code | Also labelled | Common in |
|---|---|---|
| **23A** | A23, LRV08, MN21 | Merlin, ATA, most 433MHz gate remotes |
| **27A** | A27, MN27 | ATA PTX5/PTX6, 4D Doors, many keyring remotes |
| **4LR44 / 6V** | 4AG13, PX28A | Older remotes, dog collars, cameras |

23A and 27A are both 12V but **different sizes** (27A is shorter) — they're not interchangeable. We carry [23A card packs of 5](/product/battery-23a-card-pack-of-5-ar-23a-5-be0abbea-5af6-495a-9644-7af73add0f98) and [27A card packs of 5](/product/battery-27a-card-pack-of-5-ar-27a-5-f68d2780-1d38-4647-8aed-9fb55cc5375e).

### Lithium Coin Cells (flat, 3V)

| Code | Size | Common in |
|---|---|---|
| **CR2032** | 20mm × 3.2mm | ATA PTX4, Merlin E960M series, car keys, scales |
| **CR2025** | 20mm × 2.5mm | Slim remotes, some car keys |
| **CR2016 / CR1632 / CR1620 / CR1616 / CR1220 / CR2430 / CR2450** | varies | Car keys, smaller remotes, motherboards |

CR2025 fits a CR2032 slot in a pinch but has less capacity — buy the right code. Shop [Maxell CR2032](/product/maxell-battery-cr-2032-pack-of-5-ar-mx2032-5-a3805c8a-3a11-4ac8-a8b0-fd070c9c61ff) and the rest of the [battery range](/products/batteries).

### Silver Oxide Watch Cells (1.55V — the confusing numbering)

Watch/remotes cells have **two names**: the size number and the chemistry code. Same battery, different label:

| Watch size | Silver oxide code | Alkaline equivalent |
|---|---|---|
| **321** | SR616SW | LR616 |
| **364** | SR621SW | AG1 |
| **371/370** | SR920SW | AG6 |
| **377** | SR626SW | AG4 |
| **395** | SR927SW | AG7 |
| **A76** | — | LR44 / AG13 |

So "SR626SW", "377" and "AG4" are the **same cell** — and "SR616SW" is the "321" battery people search for. We stock [Maxell SR626SW (377)](/product/maxell-battery-sr626sw-377-pack-of-5-ar-sr626-5mx-58c8147c-ea72-4ea5-825f-3da3621a638a), [SR616SW (321)](/product/maxell-battery-sr616sw-321-pack-of-5-ar-sr616-5mx-a58977c7-0c91-461f-a6d5-722aee3baf36) and [LR44/A76 packs](/product/maxell-battery-lr44-a76-pack-of-5-ar-lr44-a76-5mx-5f784c22-fc43-4477-987d-8f2ad2dcbc48).

## Which Battery for Which Remote?

- **Merlin E960M / E970M**: CR2032
- **ATA PTX4**: CR2032 · **PTX5/PTX6**: 27A
- **B&D TriTran / 4335A**: 27A or CR2032 (check yours)
- **4D Doors RC01**: 27A
- **FAAC XT2/XT4**: 2× CR2016
- **Most universal/keyring remotes**: 23A or 27A

## Safety Note — Button Batteries

Button and coin cells are a serious ingestion hazard for children. Keep spare and used batteries locked away, tape used ones before disposal, and if a battery may have been swallowed call the **Poisons Information Centre 13 11 26** immediately.

## Still Not Sure?

Send a photo of your remote or old battery to **shane@allremotes.com.au** — we'll name the cell and link you straight to it.
    `,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getBlogPostSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug);
}
