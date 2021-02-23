#!/bin/bash
ROOT=$PWD
cDate=`TZ=Asia/Kolkata date +%Y.%m.%d.%H.%M` #Current date and time
pDate=`TZ=Asia/Kolkata date +%Y.%m.%d.%H.%M -d "- 2 hour"` #Current date and time

mkdir -p logs

exec > ./logs/cicd_$cDate.log 2>&1

echo "==================================="
echo "ds-b2b-agent"
echo "==================================="
if [ ! -d ds-b2b-agent ]; then
	git clone git@bitbucket.org:appveen/ds-b2b-agent.git
fi
LAST_PULL = `cat ./LAST_PULL_B2BGW`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd ds-b2b-agent
git pull origin master
echo `date` > ../LAST_PULL_B2BGW
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
export WORKSPACE="$ROOT/ds-b2b-agent" && sh scripts/build_image.sh
cd $ROOT
echo "==================================="
echo "ds-b2b-flow"
echo "==================================="
if [ ! -d ds-b2b-flow ]; then
	git clone git@bitbucket.org:appveen/ds-b2b-flow.git
fi
LAST_PULL = `cat ./LAST_PULL_FLOW`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd ds-b2b-flow
git pull origin master
echo `date` > ../LAST_PULL_FLOW
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
cd $ROOT
echo "==================================="
echo "ds-b2b-partner-manager"
echo "==================================="
if [ ! -d ds-b2b-partner-manager ]; then
	git clone git@bitbucket.org:appveen/ds-b2b-partner-manager.git
fi
LAST_PULL = `cat ./LAST_PULL_PM`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd ds-b2b-partner-manager
git pull origin dev
echo `date` > ../LAST_PULL_PM
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
export WORKSPACE="$ROOT/ds-b2b-partner-manager" && sh scripts/build_image.sh
cd $ROOT
echo "==================================="
echo "ds-deployment-manager"
echo "==================================="
if [ ! -d ds-deployment-manager ]; then
	git clone git@bitbucket.org:appveen/ds-deployment-manager.git
fi
LAST_PULL = `cat ./LAST_PULL_DM`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd ds-deployment-manager
git pull origin master
echo `date` > ../LAST_PULL_DM
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
export WORKSPACE="$ROOT/ds-deployment-manager" && sh scripts/build_image.sh
cd $ROOT
echo "==================================="
echo "ds-gateway"
echo "==================================="
if [ ! -d ds-gateway ]; then
	git clone git@bitbucket.org:appveen/ds-gateway.git
fi
LAST_PULL = `cat ./LAST_PULL_GW`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd ds-gateway
git pull origin master
echo `date` > ../LAST_PULL_GW
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
export WORKSPACE="$ROOT/ds-gateway" && sh scripts/build_image.sh
cd $ROOT
echo "==================================="
echo "ds-monitoring"
echo "==================================="
if [ ! -d ds-monitoring ]; then
	git clone git@bitbucket.org:appveen/ds-monitoring.git
fi
LAST_PULL = `cat ./LAST_PULL_MON`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd ds-monitoring
git pull origin master
echo `date` > ../LAST_PULL_MON
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
export WORKSPACE="$ROOT/ds-monitoring" && sh scripts/build_image.sh
cd $ROOT
echo "==================================="
echo "ds-notification-engine"
echo "==================================="
if [ ! -d ds-notification-engine ]; then
	git clone git@bitbucket.org:appveen/ds-notification-engine.git
fi
LAST_PULL = `cat ./LAST_PULL_NE`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd ds-notification-engine
git pull origin master
echo `date` > ../LAST_PULL_NE
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
export WORKSPACE="$ROOT/ds-notification-engine" && sh scripts/build_image.sh
cd $ROOT
echo "==================================="
echo "ds-security"
echo "==================================="
if [ ! -d ds-security ]; then
	git clone git@bitbucket.org:appveen/ds-security.git
fi
LAST_PULL = `cat ./LAST_PULL_SEC`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd ds-security
git pull origin master
echo `date` > ../LAST_PULL_SEC
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
export WORKSPACE="$ROOT/ds-security" && sh scripts/build_image.sh
cd $ROOT
echo "==================================="
echo "ds-base"
echo "==================================="
if [ ! -d ds-base ]; then
	git clone git@bitbucket.org:appveen/ds-base.git
fi
LAST_PULL = `cat ./LAST_PULL_BASE`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd ds-base
git pull origin master
echo `date` > ../LAST_PULL_BASE
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
export WORKSPACE="$ROOT/ds-base" && sh scripts/build_image.sh
cd $ROOT
echo "==================================="
echo "ds-service-manager"
echo "==================================="
if [ ! -d ds-service-manager ]; then
	git clone git@bitbucket.org:appveen/ds-service-manager.git
fi
LAST_PULL = `cat ./LAST_PULL_SM`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd ds-service-manager
git pull origin master
echo `date` > ../LAST_PULL_SM
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
export WORKSPACE="$ROOT/ds-service-manager" && sh scripts/build_image.sh
cd $ROOT
echo "==================================="
echo "ds-user-management"
echo "==================================="
if [ ! -d ds-user-management ]; then
	git clone git@bitbucket.org:appveen/ds-user-management.git
fi
LAST_PULL = `cat ./LAST_PULL_USER`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd ds-user-management
git pull origin master
echo `date` > ../LAST_PULL_USER
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
export WORKSPACE="$ROOT/ds-user-management" && sh scripts/build_image.sh
cd $ROOT
echo "==================================="
echo "ds-workflow"
echo "==================================="
if [ ! -d ds-workflow ]; then
	git clone git@bitbucket.org:appveen/ds-workflow.git
fi
LAST_PULL = `cat ./LAST_PULL_WF`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd ds-workflow
git pull origin master
echo `date` > ../LAST_PULL_WF
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
export WORKSPACE="$ROOT/ds-workflow" && sh scripts/build_image.sh
cd $ROOT
echo "==================================="
echo "odp-ui-swagger"
echo "==================================="
if [ ! -d odp-ui-swagger ]; then
	git clone git@bitbucket.org:appveen/odp-ui-swagger.git
fi
LAST_PULL = `cat ./LAST_PULL_SWAGGER`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd odp-ui-swagger
git pull origin data.stack
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
echo `date` > ../LAST_PULL_SWAGGER
export WORKSPACE="$ROOT/odp-ui-swagger" && sh scripts/build_image.sh
cd $ROOT
echo "==================================="
echo "odp-ui-appcenter"
echo "==================================="
if [ ! -d odp-ui-appcenter ]; then
	git clone git@bitbucket.org:appveen/odp-ui-appcenter.git
fi
LAST_PULL = `cat ./LAST_PULL_APPCENTER`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd odp-ui-appcenter
git pull origin data.stack
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
echo `date` > ../LAST_PULL_APPCENTER
export WORKSPACE="$ROOT/odp-ui-appcenter" && sh scripts/build_image.sh
cd $ROOT
echo "==================================="
echo "odp-ui-author"
echo "==================================="
if [ ! -d odp-ui-author ]; then
	git clone git@bitbucket.org:appveen/odp-ui-author.git
fi
LAST_PULL = `cat ./LAST_PULL_AUTHOR`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd odp-ui-author
git pull origin data.stack
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
echo `date` > ../LAST_PULL_AUTHOR
export WORKSPACE="$ROOT/odp-ui-author" && sh scripts/build_image.sh
cd $ROOT
echo "==================================="
echo "odp-proxy"
echo "==================================="
if [ ! -d odp-proxy ]; then
	git clone git@bitbucket.org:appveen/odp-proxy.git
fi
LAST_PULL = `cat ./LAST_PULL_PROXY`
if [ ! LAST_PULL ]; then
    LAST_PULL=$pDate
fi
cd odp-proxy
git pull origin data.stack
echo "***********************************"
echo "CHANGES FOUND"
echo "***********************************"
git log --oneline --since=$LAST_PULL
echo "***********************************"
echo `date` > ../LAST_PULL_PROXY
export WORKSPACE="$ROOT/odp-proxy" && sh scripts/build_image.sh
cd $ROOT
echo "==================================="
echo "END"
echo "==================================="

exec > /dev/tty 2>&1