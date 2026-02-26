<p align="center">
  <img src="assets/logo.png" alt="MCP ShipCheck" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-shipcheck/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-shipcheck/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

```hindi
ए.के.ए. "एनपीएम रेडीनेस शेरिफ"

किसी स्थानीय पैकेज फ़ोल्डर को देखते हुए, `mcp-shipcheck` एक निश्चित प्रकाशन-तैयारी रिपोर्ट तैयार करता है: इसमें टारबॉल में क्या शामिल होगा, स्पष्ट रूप से संभावित समस्याएं (जैसे, गुम प्रकार, टूटे हुए एक्सपोर्ट, कोई लाइसेंस नहीं, आदि), और एक ठोस समाधानों की सूची।

यह "रिलीज़ की चिंता" को एक मशीन-जांच योग्य परिणाम में बदल देता है।

## विशेषताएं

- **ऑडिट**: `package.json`, `tsconfig.json`, एक्सपोर्ट और फ़ाइल की मौजूदगी का विश्लेषण करके, यह तैयारी के स्तर का मूल्यांकन करता है।
- **पैक पूर्वावलोकन**: यह `npm pack --json` चलाता है ताकि यह दिखाया जा सके कि कौन सी फाइलें शामिल हैं (और उनका आकार), बिना किसी टारबॉल को मैन्युअल रूप से अनपैक किए।
- **त्रुटियों का स्पष्टीकरण**: यह विशिष्ट त्रुटि कोडों के लिए मानव-पठनीय जानकारी और समाधान प्रदान करता है।

सभी उपकरण केवल **पढ़ने के लिए** हैं (कोई स्वचालित सुधार नहीं), इसलिए ये एमसीपी होस्ट के लिए स्वचालित रूप से उपयोग करने के लिए सुरक्षित हैं।

## उपकरण

### `shipcheck.audit`
- **इनपुट**: `{ path: string }` (पैकेज का निरपेक्ष या सापेक्ष पथ)
- **आउटपुट**: एक JSON रिपोर्ट जिसमें एक स्कोर (0-100), संरचित निष्कर्ष (विफलताएं, चेतावनियां, जानकारी), और सारांश गणनाएं शामिल हैं।

### `shipcheck.packPreview`
- **इनपुट**: `{ path: string }`
- **आउटपुट**: उन फ़ाइलों की JSON सूची जो रिलीज़ टारबॉल में शामिल की जाएंगी, साथ ही मेटाडेटा।

### `shipcheck.explainFailure`
- **इनपुट**: `{ code: string }` (उदाहरण के लिए, `PKG.EXPORTS.MISSING`)
- **आउटपुट**: त्रुटि का विस्तृत विवरण और सुझाए गए समाधान।

## स्थापना और उपयोग

### एमसीपी के साथ उपयोग

यह उपकरण एक एमसीपी क्लाइंट (जैसे क्लाउड डेस्कटॉप या एक आईडीई एक्सटेंशन) के साथ उपयोग करने के लिए डिज़ाइन किया गया है।

**कॉन्फ़िगरेशन (mcp-settings.json):**

```json
{
  "mcpServers": {
    "shipcheck": {
      "command": "node",
      "args": ["/path/to/mcp-shipcheck/build/index.js"]
    }
  }
}
```

### स्थानीय रूप से निर्माण

```bash
npm install
npm run build
```

## लाइसेंस

एमआईटी
