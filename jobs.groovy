def jobNameBuild = 'Build'
def jobNameDeploy = 'Deploy production'

job(jobNameBuild) {
    scm {
      git 'https://github.com/arisro/brosura.git', 'master', {
        extensions {
          cleanBeforeCheckout()
        }
      }
    }
    configure { node ->
        node / 'scm' / 'extensions' / 'hudson.plugins.git.extensions.impl.CloneOption' {
          shallow 'true'
          depth 1
        }
        def cnode = node / 'scm' / 'extensions' / 'hudson.plugins.git.extensions.impl.PerBuildTag'
      	(node / 'scm' / 'extensions').remove cnode

		node / 'properties' / 'com.coravy.hudson.plugins.github.GithubProjectProperty'(plugin:'github@1.24') / projectUrl('https://github.com/arisro/brosura')
        node / 'properties' / 'hudson.plugins.copyartifact.CopyArtifactPermissionProperty'(plugin:'copyartifact@1.38.1') / projectName('Deploy production')
    }
    triggers {
        scm 'H/2 * * * *'
    }
    wrappers {
        timestamps()
    }
    steps {
        shell 'yarn && node ./node_modules/gulp/bin/gulp archive'
    }
    publishers {
		archiveArtifacts {
            pattern 'dist/archive.tar.gz'
            onlyIfSuccessful()
        }
        downstream jobNameDeploy, 'SUCCESS'
    }
}

job(jobNameDeploy) {
    wrappers {
        preBuildCleanup()
        timestamps()
    }
    steps {
        copyArtifacts jobNameBuild, {
            buildSelector {
	            upstreamBuild(true)
            }
        }
        gsshFtpUploadBuilder {
          	disable false
          	serverInfo 'Web - personal~~blog~~blog.buzachis-aris.com'
          	remoteLocation '/tmp/'
          	localFilePath '$WORKSPACE/dist/archive.tar.gz'
          	fileName 'brosura.tar.gz'
        }
        gsshShellBuilder {
          	disable false
          	serverInfo 'Web - personal~~blog~~blog.buzachis-aris.com'
          	shell 'tar -xzvf /tmp/brosura.tar.gz -C /var/www/com.buzachis-aris.brosura/ || true'
        }
    }
}
