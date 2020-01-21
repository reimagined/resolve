---
id: cloud-app-management
title: Application Management
---

## Register a Domain

After you [deploy a reSolve application](cloud-get-started.md#deploy-the-application), this application is assigned an address under the **resolve.sh** domain. To assign your own domain name to the application, use the following steps.

> The described steps use the reSolve CLI. If you prefer, you can use the web GUI to perform the same steps. The required UI is available on the web GUI's **Domains** tab.

1. Use the resolve-cloud CLI's `domains add` command to add a domain name:

   ```sh
   $ resolve-cloud domains add <your domain name>
   To verify your domain add a "_resolve-challenge" TXT record with the <your_verification_code> value to your DNS
   ```

2) After the previous command is executed, the CLI asks you to add a verification record to your domain zone. Follow this instruction and add the DNS record.

3) Now you can verify your domain on the reSolve Cloud Platform. To to this, type the following command:

   ```sh
   $ resolve-cloud domains verify <your domain name>
   ```

4) Add an SSL certificate for your domain:

   ```sh
   $ resolve-cloud certificates issue <your domain name> --certificateFile <certificate-file> --keyFile <ley-file> --chainFile <chain-file>
   ```

5) Now you can assign the domain to any of your application deployments as shown below:

   ```sh
   $ resolve-cloud domains assign <your domain name> <a reSolve application deployment>
   Add a CNAME <subdomain> record with the <cname-value> value to your DNS zone
   ```

   Do not forget to configure the required `CNAME` records with your DNS provider so they point at your reSolve application.

To release a domain use the following input:

```sh
$ resolve-cloud domains release <your domain name>
```

## Manage Runtimes

The reSolve cloud platform supports versioned runtimes to provide compatibility with older applications. To view the available runtime versions through the CLI, type:

```bash
$ resolve-cloud runtimes list
VERSION
0.11.0
```

You can view runtimes used by your applications in the `list` command's output:

```bash
$ resolve-cloud list
ID                             NAME             VERSION       USERID               UPDATE
rqa6rxkghu8f9f3kjjd2tmak51     hacker-news      0.0.0         myemail@example.com  -> 0.11.0
z6ze1aqfuedw54qa0gp58xu6ov     shopping-list    0.0.0         myemail@example.com  -> 0.11.0
f3vck8svysxfx0wu9umug2vefiv0   my-app           0.10.0        myemail@example.com  -> 0.11.0
```

This output also provides information on what applications can be upgraded to a newer runtime. To upgrade an application's runtime to the latest minor within the current major version, type:

```bash
$ resolve-cloud upgrade <app-id>
```

To use a particular minor version, add the `--runtime` flag:

```bash
$ resolve-cloud upgrade <app-id> --runtime <runtime-version>
```

The runtime version should be specified in the SemVer format.

## Enable Logging

For logging to work, make sure to enable the correct debug levels for your application. See the [Debugging](debugging.md) topic for more information.

Use the reSolve Cloud CLI's `logs get` command to obtain logs:

```
$ resolve-cloud logs get <deployment>
```

## Profiling an Application

The reSolve Cloud platform allows you to trace your application's performance. You can view performance traces on the Admin Panel's **Performance** tab or in the command prompt using the reSolve CLI. To enable performance tracing, type:

```
$ resolve-cloud tracing enable <deployment>
```

To view the list of all generated traces:

```
$ resolve-cloud tracing summary <deployment>
```

To view details of particular trace:

```
$ resolve-cloud tracing get <deployment> <trace Id>
```
