# Boss Deployer

Haven't you ever faced a production deployment, in which you need to wait for boss'es green light to do it? Haven't you ever pushed something into prod, and found out afterwards that your boss was a NO GO on that? Do you want to stop seeing that? Gift your boss a Boss Deployer!

# What is it?

Boss deployer is an Arduino powered gadget, that acts like an "Inverse Panic Button". When your code is meant to become productive, the Boss Deployer lights turn blue, so the boss knows that an action is needed. If the boss presses the button, the deployment process continues autommatically, leaving you freedom to take a coffee while the boss thinks whether your code should be pushed in production
 
## The gadget
 
The gadget itself is an Arduino thingy with a 3d printed design you can find [here](https://cad.onshape.com/documents/28c9fe1e12656febeceadb5d/w/3a78536bc6161e2ace433429/e/a4ede6d6ac27e1a6b7e5e936). The Arduino connects via an ethernet cable to a network - WiFi version coming -, and when the button is pressed a message is sent to the server, which releases the pipeline. You can find the gadget code on the [Arduino](https://github.com/smarla/boss-deployer/tree/master/arduino) folder.
 
![3D model](https://raw.githubusercontent.com/smarla/boss-deployer/master/images/boss-deployer-model.png)
 
Basically, the gadget publishes a Web Server, along with a client that consumes the server. Via calls to the gadget's web server, the Raspberry server changes the state of the gadget - set locks or change working mode - so both modules publish a server and a client, and both of them are consumed altogether.
 
## The server
 
The server is a quite basic API mounted on a Raspberry Pi. It's main intention is to maintain active communication between the gadget and the outside - mainly with pipelines - and manage the states of the gadget. 
 
The server contains two main submodules, each of which with separate responsibilities:
 
* **HTTP API:** This api connects to the gadget bi-directionally - it calls gadget's API methods and receives comms from gadget's client - for managing state changes on the system - _e.g. the server calls the gadget's to engage the lock once the pipeline requests it; then it listens to calls made from the gadget's client to the server for releasing such lock_.
 
* **Socket channel:** There is a socket channel continuously connected and sharing information about the pipeline and system status. This is mainly used to get communication outside system's network, and successfully communicate with any pipeline, anywhere.

## The link

The link is a Socket server, that connects the Raspi API to the outside. Pipelines, and all external systems that consume information from boss deployer, shall be connected to this socket. The socket is available at `connect.sandnet.smarla.com`.

![Link server](https://raw.githubusercontent.com/smarla/boss-deployer/master/images/boss-deployer-link-screenshot.png)
 
# Network configuration

For creating this system, we've sandboxed a network, that contains all configuration required for the system to work appropriately. 

![Network diagram](https://raw.githubusercontent.com/smarla/boss-deployer/master/images/boss-deployer-network-basic.png)

The router generates a subnet - i.e. `sandnet.smarla.com` - and includes configuration for making devices know each other:

* **DHCP Address reservation:** We've fixed the IPs of the Gadget and the Raspberry to `192.168.0.[254, 250]` respectively.
* **Port forwarding:** All inbound requests to port 3000 will autommatically be forwarded to the gadget. The ones on the port 5000 will be routed to the server. _NOTE: This would not be needed for the configuration used on this approach. However, it is needed for our ideal state. TODO Link.
* **Dynamic DNS:** The `noip` service is used to maintain a static name on the network, independently on where it goes up. This goes along with a `CNAME` to engage the noip name - i.e. `smarla.hopto.org` - to `sandnet.smarla.com`. _NOTE: This would not be needed for the configuration used on this approach. However, it is needed for our ideal state. TODO Link.

## The ideal world

On our initial tests we were using direct WAN connection on the router, so accessing to `sandnet.smarla.com` always landed us into the system, and thus everything went alright. However, when we connect router's WAN to some other's LAN - _e.g. connecting it in the office :) - the domain will point to the main network's public IP, but we would be far beyond that, unreachable from the outside. 

To solve this, ideally, we would like to make the router connect to a `vpn` network we set up, that along with some `iptables` configuration will effectively route all communication with our domain directly into the system. Sadly, the router we used had not this feature, and the second best approach - using a `PPTP` connection configuration - wouldn't be assured to work either, we needed to think on other alternatives.

![Network diagram](https://raw.githubusercontent.com/smarla/boss-deployer/master/images/boss-deployer-network-ideal.png)

However, we believe this is the method with which you'd get bet results, while keeping the need on more modules at a minimum. Anyways, the solution chosen is not that bad :D.

## Our solution

![Network diagram](https://raw.githubusercontent.com/smarla/boss-deployer/master/images/boss-deployer-network-final.png)

As our router does not give us everything we need to successfully test this system, we make a slight turn on how the system communicates with the outside:

* **From a VPN to a socket:** Instead of creating a tunneled network to get connectivity to the system to the outside, we build up a socket server, listening on the address `connect.sandnet.smarla.com`. This socket connection is created everytime the server goes up, and thus all _system-network_ [in-out]bound configuration would be covered.

* **Control communication from the server:** Ideally we would like to manage network configuration within the same router. As this is not possible, the Raspberry server will be immediately connected to the socket upon startup, and all communications will be passed through it.


# System flow

## Startup

* The Link socket server launches and waits for connections.
* The Raspi server launches and connects to the socket, waiting for a connection `ack`. At the same time, the HTTP server included opens, waiting for incoming connections.
* The gadget's web client calls server's `/ping` operation, to verify the API is up and running. At the same time the gadget's server starts. Then it waits for response from the Raspi server, who should call gadget's `ping-ack` method.

## Locking

When a pipeline reaches a state in which a boss'es action is needed, a message must be sent from the pipeline to the socket, to the `lock` channel. The message should include this data structure:
```
{
  pipeline: 'pipeline-name',
  step: 'pipeline-step-name'
}
```

This communication with the Link server will trigger a donwards communication that will reach the Raspi server, that will call the `/lock` method of the gadget. The gadget will aquire the `locked` state, and lights should slide in blue. The lock itself will aquire a uuid, that will be used for future unlocking.
 
## Unlocking

Unlocking is triggered directly on the gadget, when the unlock button - the big one - is pressed. The gadget calls the Raspi `/unlock` method, that will send the action to the socket, to the `unlock` channel. The message sent will be:
```
{
  uuid: 'lock-uuid'
}
```

This message should be listened from the pipeline, to act in consequence, and free the pipeline.
 
## Releasing

Releasing is the method by which the boss allows every pipeline to execute, bypassing locks and needs for unlock. This can happen, if the boss is in a good mood.

Releasing starts when the boss presses the green button - Note that pipeline can't be locked for successfully releasing. Upon this, the gadget lights will start flashing in green. The `/release` method of the Raspi will be called, and it'll sent a message through the `status` channel:
```
{
  status: 'released',
  changed_at: Timestamp 
}
```

Upon creating and checking locks, this status should be fetched, to bypass all operations if the pipeline is released.

## Blocking

As there is a mode for good mood, it should be another one for bad moods :(. This is the `blocked` mode. Upon blocking, all pipelines that require a boss'es action to finish will be autommatically killed whenever they reach the state with actions required. Heck, the boss might have even something that makes all pipelines stop immediately!

When the `block` button - the red one - is pressed, the mode changes immediately to `blocked`. The lights will spin in red - we might even add a siren sound for this mode - and a `/block` call is made to Raspi's API. It redirects the message through the socket, at the `status` channel:
```
{
  status: 'blocked',
  changed_at: Timestamp
}
```

## Defaulting

When we are in the two above scenarios, the gadget won't be called for unlocking pipelines, anytime. To return to `default` mode - those where the pipelines where locked, and unlocking is required - the boss needs to press the unlock button, until light flashes shortly in blue. Then Raspi's `/default` method is called, and the `default` channel of the socket receives this message:
```
{
  status: 'default',
  changed_at: Timestamp
}
```

# Usage from pipelines

_For this project we are using Concourse CI._
  
We need to create a Concourse resource, that basically does the following:

## Connect to socket 

Reach the socket at `connect.sandnet.smarla.com`. Upon connection, you should receive a message through the `welcome` channel, that includes this:
```
{
  last_login: Timestamp, // Previous login
  status: 'default', // or 'released', or 'blocked
  lock: 'lock-uuid', // Last lock uuid
  locked: true // Or false
}
```

## Operations

### Check

Checking verifies whether there is a new version to fetch, and thus the pipeline step can start - if configured that way. Depending on the status of the system, the behaviors should be different:

* `default`: On default mode, no versions are returned if the pipeline is locked. If the `locked` attribute is false, it means the system is unlocked, and hence a new version should be released, for letting the pipeline step start. The version sent to unlock the pipeline must be the value of the `lock` attribute.
* `released`: When the pipeline is released, there is no need to check whether the pipeline is locked. Simply return a _random version name_ to let the pipeline continue immediately.
* `blocked`: When the pipeline is blocked no pipeline will pass, whatsoever. One way to do it is to simply not return any version to the resource. However, our approach will be to raise an Error - simply `Exit 1`. When a resource operation finishes with errors, the resource box on the UI will turn red - ish. We will use this to see at a glance whether the boss is allowing deployments.
 
### In

This operation gets the new element, freshly retrieved from `check`. This only makes sense on `default` mode - as when `released` there is nothing to unlock, and `blocked` pipelines should never reach this step.

Once connected to the socket, the `in` channel will give us the info about the unlock - we need to send a `{ lock: 'lock-uuid' }` object. We will receive something like this - on the `unlock-details` channel:
 ```
 {
   lock: 'lock-uuid',
   approved_by: 'Boss of bosses',
   unlocked_at: Timestamp,
   time_locked: Timestamp // How long the pipeline was locked
 }
 ```
 
 This information should be placed within the pipeline step volume - that we've received as input - in a `boss-deployer.json` file. This file could be used from the pipeline step to generate a report with the information fetched from Boss deployer.
 
### Out

When outputting a value - i.e. set the system status as `locked` - we need to generate a lock in the system. In `released` mode is enough to simply output anything, as the pipeline should continue anyways. On `blocked` status we shall never be here. Let's focus on `default` status:

To lock the system, you need to submit a message through the `lock` channel of the socket:
```
{
  pipeline: 'pipeline-name',
  step: 'pipeline-step-name'
}
```
_You can get this information from Concourse's Environment variables._

This will get directly to the Raspi, that will call the gadget to lock the system. And let's start again! :)

# The future

This have been built as a toy, however we think it has possibilities. We've thought about these enhancements, that we believe will enrich its _productive_ value:

* Create several thingies, and do some boss authentication. Then keep track of which boss did what.
* Include a display into the gadget, to show the boss what is she unlocking.
* Improve drammatically the gadget, to make it be a real thing.
* Connect the thingy over WiFi.
* Create a web interface for the system, to let the boss deployer information be more contextual - Bosses could see info, attach notes to deployments, schedule `status` changes...
* Connect the system to Slack - and other webhook-based services - to enhance the experience via real-time stuff.
* Sell the thing somewhere to earn some money.
* Do something fancy with the money... As, for instance...

![Caribbean beach](http://www.ozwallpaper.com/wp-content/uploads/2015/04/beautiful_paradise_beach_wallpaper_for_desktop.jpg)