# Boss Deployer

Haven't you ever faced a production deployment, in which you need to wait for boss'es green light to do it? Haven't you ever pushed something into prod, and found out afterwards that your boss was a NO GO on that? Do you want to stop seeing that? Gift your boss a Boss Deployer!

## What is it?

Boss deployer is an Arduino powered gadget, that acts like an "Inverse Panic Button". When your code is meant to become productive, the Boss Deployer lights turn blue, so the boss knows that an action is needed. If the boss presses the button, the deployment process continues autommatically, leaving you freedom to take a coffee while the boss thinks whether your code should be pushed in production
 
 ### The gadget
 
 The gadget itself is an Arduino thingy with a 3d printed design you can find [here](https://cad.onshape.com/documents/28c9fe1e12656febeceadb5d/w/3a78536bc6161e2ace433429/e/a4ede6d6ac27e1a6b7e5e936). The Arduino connects via WiFi to a network, and when the button is pressed a message is sent to the server, which releases the pipeline. You can find the gadget code on the [Arduino](https://github.com/smarla/boss-deployer/tree/master/arduino) folder.
 
 ### The server
 
 The server is a quite basic API with these methods:
 
 * `lock()`: Apply a lock to a pipeline, just before the step in which the boss needs to act. This is called from the pipeline itself, normally as an output resource.
 * `release()`: Remove the existing lock and free the pipeline for the target execution. This is called from the gadget, when the boss presses the button.
 * `free()`: Enable _free_ mode - all pipelines execution will be fully automated, without any boss interaction. This is called when the boss presses the _free_ button - the green one - on the gadget.
 * `control()`: Enable _controlled_ mode - returns to normal behavior, with boss action needed for successful deployments. This is called when the boss presses the _control_ button - the red one - on the gadget.
 * `needsAction()`: Gets whether a boss action is needed. This is 
 
 