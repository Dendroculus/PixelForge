export const legalModalData = {
  privacy: {
    title: "Privacy Policy",
    content: (
      <>
        <p className="font-semibold text-slate-800 text-base">We respect your privacy.</p>
        <p>At Pixel Forge, we believe that your data is yours. Because this application processes images using cloud GPUs, here is exactly what happens to your files:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Temporary Processing Storage:</strong> Uploaded images are stored in Azure Blob Storage only to run the upscaling workflow and deliver results.</li>
          <li><strong>Automated Cleanup:</strong> Original uploads are deleted after processing, and generated results are removed by automated retention cleanup (TTL/janitor) if not already removed sooner.</li>
          <li><strong>No Tracking:</strong> We do not permanently store your IP address or link it to your images. IP addresses are only used temporarily to enforce daily usage limits and prevent abuse.</li>
        </ul>
        <p>As this is an open-source project, you can view our exact backend code on GitHub to verify how your data is handled.</p>
      </>
    )
  },
  terms: {
    title: "Terms of Service",
    content: (
      <>
        <p className="font-semibold text-slate-800 text-base">Usage Guidelines</p>
        <p>By using Pixel Forge, you agree to the following terms:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Acceptable Use:</strong> You may not upload illegal, explicit, or malicious content. The platform employs automated basic security checks to reject non-image file types.</li>
          <li><strong>Rate Limiting:</strong> This tool is provided free of charge. Please do not abuse the API or run automated batch scripts against the service, as it will exhaust our GPU credits.</li>
          <li><strong>No Warranty:</strong> The service is provided &quot;as is&quot; without any warranties. We are not responsible for any lost files, interruptions in service, or specific outcomes of the AI upscaling process.</li>
        </ul>
        <p>Pixel Forge is an open-source demonstration project. The maintainers reserve the right to block access or shut down the hosted instance at any time.</p>
      </>
    )
  },
  security: {
    title: "Security Measures",
    content: (
      <>
        <p className="font-semibold text-slate-800 text-base">Keeping Your Data Safe</p>
        <p>We take security seriously. Here are the measures we have in place to protect your data:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Secure Uploads:</strong> All images are uploaded over HTTPS to ensure encryption in transit.</li>
          <li><strong>Isolated Processing:</strong> Each image is processed in an isolated environment on Azure GPUs, preventing any cross-contamination of data.</li>
          <li><strong>Automated Retention Cleanup:</strong> Uploaded and processed files are removed through automated cleanup policies, with deletion timing based on backend retention rules.</li>
          <li><strong>Basic File Validation:</strong> We perform basic checks to ensure that uploaded files are valid images, helping to prevent malicious file uploads.</li>
          <li><strong>Open Source Transparency:</strong> Our backend code is open source, allowing anyone to review our security practices and verify that we are handling data responsibly.</li>
          <li><strong>Metadata Handling:</strong> We do not store or track any metadata associated with uploaded images, ensuring your privacy is maintained.</li>
        </ul>
      </>
    )
  }
};