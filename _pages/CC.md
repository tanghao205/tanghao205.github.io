---
layout: archive
permalink: /CC/
title: " "

author_profile: true
header:
  image: "/images/H5.jpg"	
  

skin_cancer:
  - image_path: /images/SVM.JPG
    alt: "Support Vector Machine"
    title: "Support Vector Machine"
    url: /images/SVM.JPG
  - image_path: /images/K_means.JPG
    alt: "K-Nearest-Neighbor"
    title: "K-Nearest-Neighbor"
    url: /images/K_means.JPG
  - image_path: /images/RF1.jpg
    alt: "Random Forest"
    title: "Random Forest"
    url: /images/RF1.jpg
    
skin_cancer_2:
  - image_path: /images/LR.jpg
    alt: "Logistic Regression"
    title: "Logistic Regression"
    url: /images/LR.jpg
  - image_path: /images/DT.JPG
    alt: "Decision Tree"
    title: "Decision Tree"
    url: /images/DT.JPG

---

# Cloud Computing Application

# Membership Protocol and Key-value Store with C++

## This job is to create membership protocal to the peers in the network and implement fault-tolerant Key-value store on top of this.

1. Membership Protocal:  

- In network, **Membership protocol** is to detect peer's join, failure and leave with reliable accuracy.  
- Each peer received other's status(list) and **gossip** their status(list) to all peers under the protocal. So the whole network will have the updating status communication.  
- It must be able to handle message **losses** and **delay** simultaneously and log the peer join, leave, failure status. 

2. Fault-tolerant Key-value Store:

- The peers in the network will construct a **load-balancing** hashing ring.
- The peers network will implement a fault-tolerant **Key-value(KV) store** and sustain it by peer-to-peer(P2P) communication under the membership protocal. The KV record will be stored with **3 replica** (in 3 peers).
- KV store support Create, Remove, Update, Delete(CRUD) functions.
- Read and Write are based on **Quorum** consistency to the 3 KV replicas.
- The consitency is maintained and repaired by **stabilization** mechanism.  

Here is protocol's 3-layer stucture: Application, Peer-to-Peer and Emulated Network Layer.  
  
| Layer                      | Job                                         |
| -------------------------- | ------------------------------------------- |
| 1) Emulated Network | Init peer/member's address. Send and Receive message between peer with order. Shut down the network. |
| 2) Application | Run function to Peer start and join to network. Run application to impelment P2P membership protocal and KV store. |
| 3) Peer-to-peer | Define the membership protocal (methods) and gossip brocasting. Deploy the KV store |



