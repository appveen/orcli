# ORCLI
ODP Release CLI (ORCLI) is a node CLI tool to do release in any machine.

### Setup
- Install JDK 11
- Install Maven 3.6.x
- Install Node 8.x
- Install Angular 6
- Install osslsigncode

### Install JDK 11
```sh
wget https://download.java.net/java/GA/jdk11/9/GPL/openjdk-11.0.2_linux-x64_bin.tar.gz
tar -xvzf openjdk-11.0.2_linux-x64_bin.tar.gz
cp -r  jdk-11.0.2 /opt/jdk-11
```

### Install Maven 3.6.x
```sh
wget http://apachemirror.wuchna.com/maven/maven-3/3.6.1/binaries/apache-maven-3.6.1-bin.tar.gz
tar -xvzf apache-maven-3.6.1-bin.tar.gz
cp -r  apache-maven-3.6.1 /opt/apache-maven-3.6.1
```

### Install Node 8.x
```sh
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install Angular 6
```sh
sudo npm i -g @angular/cli@6
```

### Install osslsigncode
```sh
sudo apt-get install -y osslsigncode
```

### How to run
```sh
node index.js
```