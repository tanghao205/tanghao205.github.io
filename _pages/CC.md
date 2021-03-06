---
layout: single
permalink: /CC/
classes: wide
title: " "
toc: true

author_profile: true
header:
  image: "/images/H5.jpg"	

---

<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-156453592-1"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'UA-156453592-1');
</script>

# Cloud Computing Application

<figure>
    <a href="/images/MR.JPG"><img src="/images/MR.JPG"></a>
</figure>

- Map-Reduce is traditional computation framework in big data processing. 
- This work use Map-Reduce framework in **docker container** to process the storm-event impact in the US.  
- I invested the data and display the storm-event evolution trend as the indicator to climate change.  
- On the other hand, the computation framework is also evaluated during the data processing. 

***Here is the storm-event evolution:***

<figure>
    <a href="/images/Storm_event.jpg"><img src="/images/Storm_event.jpg"></a>
</figure>  

***Below is the (b) CPU processing time and (c) framework processing time (CPU + Frame) in different input size. There exist extra overhead in map-reduce framework:***

<figure>
    <a href="/images/Processing_time.jpg"><img src="/images/Processing_time.jpg"></a>
</figure>  



[Report](https://drive.google.com/file/d/1Ll-DVjvoT5jgtDpTFXKdodoYxFH5qcuP/view?usp=sharing)

# Membership Protocol and Key-value Store with C++

***This job is to create membership protocal to the peers in the network and implement fault-tolerant Key-value store on top of this.***

a) Membership Protocal:  

- In network, **Membership protocol** is to detect peer's join, failure and leave with reliable accuracy.  
- Each peer received other's status(list) and **gossip** their status(list) to all peers under the protocal. So the whole network will have the updating status communication.  
- It must be able to handle message **losses** and **delay** simultaneously and log the peer join, leave, failure status. 

b) Fault-tolerant Key-value Store:  

- The peers in the network will construct a **load-balancing** hashing ring.
- The peers network will implement a fault-tolerant **Key-value(KV) store** and sustain it by peer-to-peer(P2P) communication under the membership protocal. The KV record will be stored with **3 replica** (in 3 peers).
- KV store support Create, Remove, Update, Delete(CRUD) functions.
- Read and Write are based on **Quorum** consistency to the 3 KV replicas.
- The consitency is maintained and repaired by **stabilization** mechanism.  

Here is protocol's 3-layer stucture: Application, Peer-to-Peer and Emulated Network Layer.  
  
| Layer                      | Job                                         |
| -------------------------- | ------------------------------------------- |
| Emulated Network | Init peer/member's address. Send and Receive message between peer with order. Shut down the network. |
| Application | Run function to Peer start and join to network. Run application to impelment P2P membership protocal and KV store. |
| Peer-to-peer | Define the membership protocal (methods) and gossip brocasting. Deploy the KV store |

***TLDR.***  

***Below is the head file to the P2P layer major function declaration:***

```c++
/**********************************
 * FILE NAME: MP2Node.h
 *
 * DESCRIPTION: MP2Node class header file
 **********************************/

#ifndef MP2NODE_H_
#define MP2NODE_H_

/**
 * Header files
 */
#include "stdincludes.h"
#include "EmulNet.h"
#include "Node.h"
#include "HashTable.h"
#include "Log.h"
#include "Params.h"
#include "Message.h"
#include "Queue.h"

/**
 * CLASS NAME: MP2Node
 *
 * DESCRIPTION: This class encapsulates all the key-value store functionality
 * 				including:
 * 				1) Ring
 * 				2) Stabilization Protocol
 * 				3) Server side CRUD APIs
 * 				4) Client side CRUD APIs
 */

class MP2Node {
private:
	// Vector holding the next two neighbors in the ring who have my replicas, from default
	vector<Node> hasMyReplicas;
	// Vector holding the previous two neighbors in the ring whose replicas I have, from default
	vector<Node> haveReplicasOf;
	// Ring, from default
	vector<Node> ring;
	// Hash Table, from default
	HashTable * ht;
	// Member representing this member, from default
	Member *memberNode;
	// Params object, from default
	Params *par;
	// Object of EmulNet, from default
	EmulNet * emulNet;
	// Object of Log, from default
	Log * log;
	// Transaction Id vector maintained by this node
	vector<int> transID;//
	// Map holding Transaction ID and corresponding value returned by certain READ operation (transaction ID)
	map<int, vector<string>> transId_Value;//
	// Transaction Pool holding Transaction ID and corresponding Operation for each transaction performed by Node
	map<int, string> transactionPool;//
	// Map holding Transaction ID and corresponding result for each Operation performed by transaction
	map<int, vector<bool>> transId_result;//

public:
	MP2Node(Member *memberNode, Params *par, EmulNet *emulNet, Log *log, Address *addressOfMember);
	Member * getMemberNode() {
		return this->memberNode;
	}

	// ring functionalities
	void updateRing();
	void updateNeighbor();
	vector<Node> getMembershipList();
	size_t hashFunction(string key);

	// client side CRUD APIs, from default
	void clientCreate(string key, string value);
	void clientRead(string key);
	void clientUpdate(string key, string value);
	void clientDelete(string key);

	// handle messages from receiving queue, from default
	void checkMessages();

	// coordinator dispatches messages to corresponding nodes, from default
	void dispatchMessages(Message *message);
	
	// Check read values and return if it has quorum
	string readValue(vector<string> readreplymsg);//

	// Find the addresses of nodes that are responsible for a key, called by Application.cpp, from default
	vector<Node> findNodes(string key);
	
	// Overloading findNodes: Find the neighbor of the given hashcode from localNodes
	vector<Node> findNodes(size_t pos, vector<Node> replicaNodes);//

	// Return element position from the given vector
	int nodePositionInVector(Node elementNode, vector<Node> nodeList);//
	
	// Whether element is present in the vector or not
	bool isElement(Node elementNode, vector<Node> nodeList);//
	
	// receive messages from Emulnet, from default
	bool recvLoop();
	static int enqueueWrapper(void *env, char *buff, int size);
	
	// server, from default
	bool createKeyValue(string key, string value, ReplicaType replica, int transID, Address selfAddr);
	string readKey(string key, int transID, Address selfAddr);
	bool updateKeyValue(string key, string value, ReplicaType replica, int transID, Address selfAddr);
	bool deletekey(string key, int transID, Address selfAddr);

	// stabilization protocol - handle multiple failures
	void stabilizationProtocol(vector<Node> memberList);  //vector<Node> memberList

	// Transaction ID 
	int getTransactionId(vector<int> transactionID);//

	~MP2Node();
};

#endif /* MP2NODE_H_ */

```
# Other Application
- AWS EC2 implement
- HBase
- Storm
