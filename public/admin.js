if(typeof queueMicrotask==="undefined"){const qm=(fn)=>Promise.resolve().then(fn);try{window.queueMicrotask=qm;}catch{}try{globalThis.queueMicrotask=qm;}catch{}}

// node_modules/preact/dist/preact.mjs
var n;
var t;
var r;
var i;
var u;
var f;
var e;
var o;
var l;
var c;
var a;
var s;
var h = /* @__PURE__ */ Symbol.for("pv");
var p = {};
var v = [];
var y = /^m(i|n|o|s|text|space)$/;
var w = Array.isArray;
var d = v.slice;
var _ = Object.assign;
function g(n2) {
  n2 && n2.parentNode && n2.remove();
}
function k(n2, t3, r3) {
  var i3, u3, f3, e3 = {}, o3 = arguments.length;
  for (f3 in t3) "key" == f3 ? i3 = t3[f3] : "ref" == f3 && "function" != typeof n2 ? u3 = t3[f3] : e3[f3] = t3[f3];
  return o3 > 2 && (e3.children = o3 > 3 ? d.call(arguments, 2) : r3), m(n2, e3, i3, u3, null);
}
function b(n2, t3, r3) {
  var i3, u3, f3, e3 = _({}, n2.props), o3 = arguments.length;
  for (f3 in t3) "key" == f3 ? i3 = t3[f3] : "ref" == f3 && "function" != typeof n2.type ? u3 = t3[f3] : e3[f3] = t3[f3];
  return o3 > 2 && (e3.children = o3 > 3 ? d.call(arguments, 2) : r3), m(n2.type, e3, void 0 !== i3 ? i3 : n2.key, void 0 !== u3 ? u3 : n2.ref, null);
}
function m(r3, i3, u3, f3, e3) {
  var o3 = { type: r3, props: i3, key: u3, ref: f3, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: h, __v: e3 || ++t, __i: -1, __u: 0 };
  return !e3 && n.vnode && n.vnode(o3), o3;
}
function $() {
  return { current: null };
}
function M(n2) {
  return n2.children;
}
function x(n2, t3) {
  this.props = n2, this.context = t3, this.__g = 0;
}
function S(n2, t3) {
  if (null == t3) return n2.__ && S(n2.__, n2.__i + 1);
  for (var r3; t3 < n2.__k.length; t3++) if ((r3 = n2.__k[t3]) && r3.__e) return r3.__e;
  return "function" != typeof n2.type || n2.props.__P ? null : S(n2);
}
function C(n2) {
  if ((n2 = n2.__) && n2.__c && !n2.props.__P) return n2.__e = null, n2.__k.some(function(t3) {
    return t3 && (n2.__e = t3.__e);
  }), C(n2);
}
function j(t3) {
  (8 & t3.__g || (t3.__g |= 8, i.push(t3), f++)) && u == n.debounceRendering || ((u = n.debounceRendering) || queueMicrotask)(L);
}
function L() {
  var t3, r3, o3, l3, c3, a3, s3, p3, v3;
  try {
    for (r3 = 1; i.length; ) i.length > r3 && i.sort(e), t3 = i.shift(), r3 = i.length, 8 & t3.__g && (l3 = void 0, c3 = void 0, a3 = (c3 = (o3 = t3).__v).__e, s3 = [], p3 = [], (v3 = o3.__P) && ((l3 = _({ constructor: h }, c3)).__v = c3.__v + 1, n.vnode && n.vnode(l3), V(v3, l3, c3, o3.__n, v3.namespaceURI, 32 & c3.__u ? [a3] : null, s3, a3 || S(c3), 32 & c3.__u, p3), l3.__v = c3.__v, l3.__.__k[l3.__i] = l3, D(s3, l3, p3), c3.__ = c3.__e = null, l3.__e != a3 && C(l3)));
  } finally {
    (f = i.length) && (u || queueMicrotask)(L);
  }
}
function H(n2, t3, r3, i3, u3, f3, e3, o3, l3, c3, a3) {
  var s3, h3, y3, w4, d3, _3, g3 = i3.__k || v, k4 = t3.length;
  for (l3 = I(r3, t3, g3, l3, k4), s3 = 0; s3 < k4; s3++) null != (y3 = r3.__k[s3]) && (h3 = ~y3.__i && g3[y3.__i] || p, y3.__i = s3, _3 = V(n2, y3, h3, u3, f3, e3, o3, l3, c3, a3), w4 = y3.__e, (h3.ref != y3.ref || 8 & h3.__u) && (h3.ref && F(h3.ref, null, y3, h3), y3.ref && a3.push(y3.ref, y3.__c || w4, y3)), d3 = d3 || w4, 4 & y3.__u ? (l3 = q(y3, l3, n2, !h3.__v), h3.__e && (h3.__e = null)) : "function" == typeof y3.type && void 0 !== _3 ? l3 = _3 : w4 && (l3 = w4.nextSibling), y3.__u &= -21);
  return r3.__e = d3, l3;
}
function I(n2, t3, r3, i3, u3) {
  var f3, e3, o3, l3, c3, a3, s3, p3, v3, y3 = r3.length, d3 = y3, _3 = 0, g3 = 0, k4 = n2.__k = Array(u3);
  for (f3 = 0; f3 < u3; f3++) null != (e3 = t3[f3]) && "boolean" != typeof e3 && "function" != typeof e3 ? ("object" != typeof e3 || e3.constructor === String ? e3 = k4[f3] = m(null, e3) : w(e3) ? e3 = k4[f3] = m(M, { children: e3 }) : e3.constructor === h && e3.__b ? e3 = k4[f3] = m(e3.type, e3.props, e3.key, e3.ref, e3.__v) : k4[f3] = e3, l3 = f3 + _3, e3.__ = n2, e3.__b = n2.__b + 1, o3 = null, ~(c3 = e3.__i = O(e3, r3, l3, d3)) && (d3--, (o3 = r3[c3]) && (o3.__u |= 2)), o3 && o3.__v ? (e3.__u |= 16, c3 == l3 - 1 ? _3-- : c3 == l3 + 1 ? _3++ : c3 != l3 && (c3 > l3 ? _3-- : _3++, g3 = 1)) : (~c3 || (u3 > y3 ? _3-- : u3 < y3 && _3++), "function" != typeof e3.type && (e3.__u |= 4))) : k4[f3] = null;
  if (g3) {
    for (a3 = [], s3 = [], f3 = 0; f3 < u3; f3++) if ((e3 = k4[f3]) && 16 & e3.__u) {
      for (_3 = 0, p3 = a3.length; _3 < p3; ) a3[v3 = _3 + p3 >> 1] < e3.__i ? _3 = v3 + 1 : p3 = v3;
      a3[_3] = e3.__i, s3[f3] = _3 + 1;
    }
    for (_3 = a3.length; f3--; ) s3[f3] && (s3[f3] == _3 ? _3-- : k4[f3].__u |= 4);
  }
  if (d3) for (f3 = 0; f3 < y3; f3++) !(o3 = r3[f3]) || 2 & o3.__u || (o3.__e == i3 && (i3 = S(o3)), G(o3, o3));
  return i3;
}
function q(n2, t3, r3, i3) {
  var u3, f3, e3, o3;
  if ("function" == typeof n2.type) {
    if (n2.props.__P) return t3;
    if (u3 = n2.__k) for (f3 = 0; f3 < u3.length; f3++) u3[f3] && (u3[f3].__ = n2, t3 = q(u3[f3], t3, r3, false));
    return t3;
  }
  for (t3 && !t3.parentNode && (t3 = S(n2)) && !t3.parentNode && (t3 = null), e3 = n2.__e, o3 = t3; o3 && 8 == o3.nodeType; ) o3 = o3.nextSibling;
  for (e3 != o3 && (!i3 && r3.moveBefore && e3.parentNode ? r3.moveBefore(e3, t3) : r3.insertBefore(e3, t3 || null)), t3 = e3; (t3 = t3 && t3.nextSibling) && 8 == t3.nodeType && !t3.data.startsWith("$s"); ) ;
  return t3;
}
function A(n2, t3) {
  return t3 = t3 || [], null != n2 && "boolean" != typeof n2 && (w(n2) ? n2.some(function(n3) {
    A(n3, t3);
  }) : t3.push(n2)), t3;
}
function O(n2, t3, r3, i3) {
  var u3, f3 = n2.key, e3 = n2.type, o3 = t3[r3], l3 = o3 && !(2 & o3.__u);
  if (null === o3 && null == f3 || l3 && f3 == o3.key && e3 == o3.type) return r3;
  if (i3 > (l3 ? 1 : 0)) {
    for (u3 = r3 - 1; u3 >= 0; u3--) if ((o3 = t3[u3]) && !(2 & o3.__u) && f3 == o3.key && e3 == o3.type) return u3;
    for (u3 = r3 + 1; u3 < t3.length; u3++) if ((o3 = t3[u3]) && !(2 & o3.__u) && f3 == o3.key && e3 == o3.type) return u3;
  }
  return -1;
}
function P(n2, t3, r3) {
  null == r3 && (r3 = ""), "-" == t3[0] ? n2.setProperty(t3, r3) : n2[t3] = r3;
}
function T(n2, t3, r3, i3, u3) {
  var f3, e3;
  if ("style" == t3) if ("string" == typeof r3) n2.style.cssText = r3;
  else {
    if ("string" == typeof i3 && (n2.style.cssText = i3 = ""), i3) for (t3 in i3) r3 && t3 in r3 || P(n2.style, t3);
    if (r3) for (t3 in r3) i3 && r3[t3] == i3[t3] || P(n2.style, t3, r3[t3]);
  }
  else if ("o" == t3[0] && "n" == t3[1]) (n2.__e || (n2.__e = {}))[t3] = r3, r3 && i3 || (e3 = a[t3] || (a[t3] = N(t3)), (n2.__a || (n2.__a = {}))[t3] = c, f3 = t3 != (t3 = t3.replace(l, "$1")), (t3 = t3.slice(2))[0] < "a" && (t3 = t3.toLowerCase()), r3 ? n2.addEventListener(t3, e3, f3) : n2.removeEventListener(t3, e3, f3));
  else {
    if ("http://www.w3.org/2000/svg" == u3) t3 = t3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    else if ("width" != t3 && "height" != t3 && "href" != t3 && "list" != t3 && "form" != t3 && "tabIndex" != t3 && "download" != t3 && "rowSpan" != t3 && "colSpan" != t3 && "role" != t3 && "popover" != t3 && t3 in n2) try {
      return void (n2[t3] = null == r3 ? "" : r3);
    } catch (n3) {
    }
    if ("function" == typeof r3) return;
    null == r3 || false === r3 && "-" != t3[4] ? n2.removeAttribute(t3) : n2.setAttribute(t3, "popover" == t3 && 1 == r3 ? "" : r3);
  }
}
function N(t3) {
  return function(r3) {
    var i3 = this.__e;
    if (i3) {
      if (i3 = i3[t3], null == r3[o]) r3[o] = c++;
      else if (r3[o] < this.__a[t3]) return;
      return i3(n.event ? n.event(r3) : r3);
    }
  };
}
function V(t3, r3, i3, u3, f3, e3, o3, l3, c3, a3) {
  var s3, p3, y3, d3, k4, b3, m3, $3, C4, j4, L3, I3, q4, A4, O3, P4, T4, N3, V3 = r3.type;
  if (r3.constructor !== h) return null;
  128 & i3.__u && (c3 = 32 & i3.__u, s3 = i3.__c.__z) && (r3.__u |= c3, p3 = e3 = [], 8 == s3.nodeType ? l3 = z(s3, e3) : e3.push(s3), l3 = e3[0] || l3), (s3 = n.__b) && s3(r3);
  n: if ("function" == typeof V3) {
    y3 = o3.length;
    try {
      if ($3 = r3.props, C4 = (s3 = V3.prototype) && s3.render, j4 = (s3 = V3.contextType) && u3[s3.__c], L3 = s3 ? j4 ? j4.props.value : s3.__ : u3, (d3 = i3.__c) ? (r3.__c = d3, 2 & d3.__g && (d3.__g |= 1)) : (C4 ? r3.__c = d3 = new V3($3, L3) : (r3.__c = d3 = new x($3, L3), d3.constructor = V3, d3.render = J), j4 && j4.sub(d3), d3.state || (d3.state = {}), d3.__n = u3, d3.__g |= 8, d3.__h = [], d3.__k = []), C4 && (d3.__s || (d3.__s = d3.state), V3.getDerivedStateFromProps && (d3.__s == d3.state && (d3.__s = _({}, d3.__s)), _(d3.__s, V3.getDerivedStateFromProps($3, d3.__s)))), k4 = d3.props, b3 = d3.state, d3.__v = r3, i3.__c) {
        if ($3 !== k4 && C4 && !V3.getDerivedStateFromProps && d3.componentWillReceiveProps && d3.componentWillReceiveProps($3, L3), r3.__v == i3.__v && !(8 & d3.__g) || !(4 & d3.__g) && d3.shouldComponentUpdate && false === d3.shouldComponentUpdate($3, d3.__s, L3)) {
          r3.__v != i3.__v && (d3.props = $3, d3.state = d3.__s, d3.__g &= -9), r3.__e = i3.__e, r3.__k = i3.__k, r3.__k.some(function(n2) {
            n2 && (n2.__ = r3);
          }), v.push.apply(d3.__h, d3.__k), d3.__k = [], d3.__h.length && o3.push(d3), l3 = S(i3);
          break n;
        }
        d3.componentWillUpdate && d3.componentWillUpdate($3, d3.__s, L3), C4 && d3.componentDidUpdate && d3.__h.push(function() {
          d3.componentDidUpdate(k4, b3, m3);
        });
      } else C4 && !V3.getDerivedStateFromProps && d3.componentWillMount && d3.componentWillMount(), C4 && d3.componentDidMount && d3.__h.push(d3.componentDidMount);
      if (d3.context = L3, d3.props = $3, d3.__P = t3, d3.__g &= -5, I3 = n.__r, q4 = 0, C4) d3.state = d3.__s, d3.__g &= -9, I3 && I3(r3), s3 = d3.render(d3.props, d3.state, d3.context), v.push.apply(d3.__h, d3.__k), d3.__k = [];
      else do {
        d3.__g &= -9, I3 && I3(r3), s3 = d3.render(d3.props, d3.state, d3.context), d3.state = d3.__s;
      } while (8 & d3.__g && ++q4 < 25);
      d3.state = d3.__s, d3.getChildContext && (u3 = _({}, u3, d3.getChildContext())), C4 && i3.__c && d3.getSnapshotBeforeUpdate && (m3 = d3.getSnapshotBeforeUpdate(k4, b3)), A4 = s3 && s3.type === M && null == s3.key ? s3.props.children : s3, $3.__P && (s3 = l3, f3 = (t3 = $3.__P).namespaceURI, c3 = e3 = null, i3.props && i3.props.__P != t3 && (i3.__k.some(function(n2) {
        n2 && G(n2, n2);
      }), i3.__k = null), l3 = i3.__k ? S(i3, 0) : null), l3 = H(t3, w(A4) ? A4 : [A4], r3, i3, u3, f3, e3, o3, l3, c3, a3), $3.__P && (r3.__e = null, l3 = s3), r3.__u &= -161, p3 && p3.some(g), d3.__h.length && o3.push(d3), 1 & d3.__g && (d3.__g &= -4);
    } catch (t4) {
      if (o3.length = y3, r3.__v = null, c3 || e3) if (t4.then) {
        if (O3 = 0, r3.__u |= 128 | c3, e3) {
          for (~(T4 = e3.indexOf(l3 || void 0)) || (T4 = e3.length); (N3 = e3[T4 - 1]) && 8 == N3.nodeType; ) T4--;
          for (; T4 < e3.length; T4++) if (N3 = e3[T4]) {
            if (e3[T4] = null, 8 == N3.nodeType) {
              if (N3.data.startsWith("$s")) O3++ || (P4 = N3);
              else if (O3 && N3.data.startsWith("/$s") && !--O3) break;
            } else if (!O3) break;
          }
        }
        if (!P4) {
          for (; l3 && 8 == l3.nodeType && l3.nextSibling; ) l3 = l3.nextSibling;
          P4 = l3;
        }
        (s3 = z(P4 = r3.__c.__z || (r3.__c.__z = P4))) ? (r3.__e = P4, l3 = s3) : r3.__e = l3, l3 = l3 && l3.nextSibling;
      } else e3 && e3.some(g);
      else r3.__e = i3.__e;
      r3.__k || (r3.__k = i3.__k || []), t4.then || B(r3), n.__e(t4, r3, i3);
    }
  } else l3 = r3.__e = E(i3.__e, r3, i3, u3, f3, e3, o3, c3, a3, t3);
  return (s3 = n.diffed) && s3(r3), l3;
}
function z(n2, t3) {
  if (n2 && 8 == n2.nodeType && n2.data.startsWith("$s")) for (var r3 = 1; n2 = n2.nextSibling; ) {
    if (8 == n2.nodeType) {
      if (n2.data.startsWith("$s")) r3++;
      else if (n2.data.startsWith("/$s") && !--r3) return n2;
    }
    t3 && t3.push(n2);
  }
}
function B(n2) {
  n2 && (n2.__c && (n2.__c.__g |= 4), n2.__k && n2.__k.some(B));
}
function D(t3, r3, i3) {
  for (var u3 = 0; u3 < i3.length; ) F(i3[u3++], i3[u3++], i3[u3++]);
  n.__c && n.__c(r3, t3), t3.some(function(r4) {
    try {
      t3 = r4.__h, r4.__h = [], t3.some(function(n2) {
        n2.call(r4);
      });
    } catch (t4) {
      n.__e(t4, r4.__v);
    }
  });
}
function E(t3, r3, i3, u3, f3, e3, o3, l3, c3, a3) {
  var s3, h3, v3, _3, k4, b3, m3, $3, M3, x4 = i3.props || p, C4 = r3.props, j4 = r3.type;
  if ("svg" == j4 ? f3 = "http://www.w3.org/2000/svg" : "math" == j4 ? f3 = "http://www.w3.org/1998/Math/MathML" : f3 || (f3 = "http://www.w3.org/1999/xhtml"), e3) {
    for (s3 = 0; s3 < e3.length; s3++) if ((k4 = e3[s3]) && (j4 ? k4.localName == j4 : 3 == k4.nodeType)) {
      t3 = k4, e3[s3] = null;
      break;
    }
  }
  if (!t3) {
    if ($3 = a3.ownerDocument || document, !j4) return $3.createTextNode(C4);
    t3 = $3.createElementNS(f3, j4, C4.is && C4), l3 && (n.__m && n.__m(r3, e3), l3 = false), e3 = null;
  }
  if (j4) {
    if (a3 = "template" == j4 && t3.content || t3, e3 = "textarea" == j4 && null != C4.defaultValue ? null : e3 && d.call(a3.childNodes), !l3 && e3) for (x4 = {}, s3 = 0; s3 < t3.attributes.length; s3++) x4[(k4 = t3.attributes[s3]).name] = k4.value;
    for (s3 in x4) k4 = x4[s3], "dangerouslySetInnerHTML" == s3 ? v3 = k4 : "children" == s3 || s3 in C4 || "value" == s3 && "defaultValue" in C4 || "checked" == s3 && "defaultChecked" in C4 || T(t3, s3, null, k4, f3);
    for (s3 in M3 = 1 & i3.__u, C4) k4 = C4[s3], "children" == s3 ? _3 = k4 : "dangerouslySetInnerHTML" == s3 ? h3 = k4 : "value" == s3 ? b3 = k4 : "checked" == s3 ? m3 = k4 : l3 && "function" != typeof k4 || !(x4[s3] !== k4 || M3 && null != k4) || T(t3, s3, k4, x4[s3], f3);
    h3 ? (l3 || v3 && (h3.__html == v3.__html || h3.__html == t3.innerHTML) || (t3.innerHTML = h3.__html), r3.__k = []) : (v3 && (t3.textContent = ""), ("foreignObject" == j4 || "http://www.w3.org/1998/Math/MathML" == f3 && y.test(j4)) && (f3 = "http://www.w3.org/1999/xhtml"), H(a3, w(_3) ? _3 : [_3], r3, i3, u3, f3, e3, o3, e3 ? e3[0] : i3.__k && S(i3, 0), l3, c3), e3 && e3.some(g)), l3 && "textarea" != j4 || (s3 = "value", "progress" == j4 && null == b3 ? t3.removeAttribute(s3) : null == b3 || b3 === t3[s3] && ("progress" != j4 || b3) || T(t3, s3, b3, x4[s3], f3), s3 = "checked", null != m3 && m3 != t3[s3] && T(t3, s3, m3, x4[s3], f3));
  } else x4 === C4 || l3 && t3.data == C4 || (t3.data = C4);
  return t3;
}
function F(t3, r3, i3, u3) {
  try {
    "function" == typeof t3 ? r3 ? r3.__x = t3(r3) || 1 : u3 && (u3 = u3.__c || u3.__e) && (r3 = u3.__x) && (u3.__x = null, "function" == typeof r3 ? r3() : t3(null)) : t3.current = r3;
  } catch (t4) {
    n.__e(t4, i3);
  }
}
function G(t3, r3, i3) {
  var u3, f3, e3, o3;
  if (n.unmount && n.unmount(t3), !(u3 = t3.ref) || u3.current && u3.current != t3.__e || F(u3, null, r3, t3), u3 = t3.__c) {
    if (u3.componentWillUnmount) try {
      u3.componentWillUnmount();
    } catch (t4) {
      n.__e(t4, r3);
    }
    u3.__P = u3.__n = null;
  }
  if (u3 = t3.__k) for (o3 = 0; o3 < u3.length; o3++) u3[o3] && G(u3[o3], r3, "function" != typeof t3.type || i3 && !t3.props.__P);
  !i3 && (u3 = t3.__c) && (u3 = u3.__z) && (f3 = z(u3, e3 = [])) && (u3 == t3.__e && e3.some(g), g(f3), g(u3)), (u3 = t3.__e) && (i3 || g(u3), u3.__e && (u3.__e = null)), t3.__e = t3.__c = t3.__ = null;
}
function J(n2, t3, r3) {
  return this.constructor(n2, r3);
}
function K(t3, r3) {
  var i3, u3, f3, e3;
  n.__ && n.__(t3, r3), 9 == r3.nodeType && (r3 = r3.documentElement), u3 = (i3 = t3 && 32 & t3.__u) ? null : r3.__k, r3.__k = m(M, { children: [t3] }), f3 = [], e3 = [], V(r3, r3.__k, u3 || p, p, r3.namespaceURI, u3 ? null : r3.firstChild ? d.call(r3.childNodes) : null, f3, u3 ? u3.__e : r3.firstChild, i3, e3), D(f3, r3.__k, e3), r3.__k.props.children = null;
}
function Q(n2, t3) {
  n2 && "object" == typeof n2 && (n2.__u |= 32), K(n2, t3);
}
function R(n2) {
  function t3(n3) {
    var r3, i3;
    return this.getChildContext || (r3 = /* @__PURE__ */ new Set(), (i3 = {})[t3.__c] = this, this.getChildContext = function() {
      return i3;
    }, this.shouldComponentUpdate = function(n4) {
      this.props.value != n4.value && r3.forEach(function(n5) {
        n5.__g |= 4, j(n5);
      });
    }, this.sub = function(n4) {
      r3.add(n4);
      var t4 = n4.componentWillUnmount;
      n4.componentWillUnmount = function() {
        r3.delete(n4), t4 && t4.call(n4);
      };
    }), n3.children;
  }
  return t3.__c = "__cC" + s++, t3.__ = n2, t3.Provider = (t3.Consumer = function(n3, t4) {
    return n3.children(t4);
  }).contextType = t3, t3;
}
function U(n2) {
  return n2.children;
}
function W(n2, t3) {
  return m(U, { __P: t3, children: n2 });
}
n = { __e: function(n2, t3, r3, i3) {
  for (var u3, e3, o3; t3 = t3.__; ) if ((u3 = t3.__c) && !(1 & u3.__g)) {
    u3.__g |= 4;
    try {
      if ((o3 = (e3 = u3.constructor) && e3.getDerivedStateFromError) && u3.setState(e3.getDerivedStateFromError(n2)), u3.componentDidCatch && (u3.componentDidCatch(n2, i3 || {}), o3 = 1), o3 && 8 & u3.__g) return void (u3.__g |= 2);
    } catch (t4) {
      n2 = t4;
    }
  }
  throw f = 0, n2;
} }, t = 0, r = function(n2) {
  return null != n2 && n2.constructor === h;
}, x.prototype.setState = function(n2, t3) {
  var r3 = this.__s;
  r3 && r3 != this.state || (r3 = this.__s = _({}, this.state)), "function" == typeof n2 && (n2 = n2(_({}, r3), this.props)), n2 && (_(r3, n2), this.__v && (t3 && this.__k.push(t3), j(this)));
}, x.prototype.forceUpdate = function(n2) {
  this.__v && (this.__g |= 4, n2 && this.__h.push(n2), j(this));
}, x.prototype.render = M, i = [], f = 0, e = function(n2, t3) {
  return n2.__v.__b - t3.__v.__b;
}, o = /* @__PURE__ */ Symbol(), l = /(PointerCapture)$|Capture$/i, c = 0, a = {}, s = 0;

// node_modules/preact/hooks/dist/hooks.mjs
var t2;
var r2;
var u2;
var i2;
var o2 = Object.is;
var f2 = 0;
var c2 = [];
var e2 = [];
var a2 = n;
var v2 = a2.__b;
var l2 = a2.__r;
var m2 = a2.diffed;
var h2 = a2.__c;
var s2 = a2.unmount;
var p2 = a2.__;
function y2(n2, t3) {
  a2.__h && a2.__h(r2, n2, f2 || t3), f2 = 0;
  var u3 = r2.__H || (r2.__H = { __: [], __h: [] });
  return n2 >= u3.__.length && u3.__.push({}), u3.__[n2];
}
function d2(n2) {
  return f2 = 1, _2(G2, n2);
}
function _2(n2, u3, i3) {
  var f3 = y2(t2++, 2);
  if (f3.t = n2, !f3.__c && (f3.__ = [i3 ? i3(u3) : G2(void 0, u3), function(n3) {
    var t3 = f3.__N ? f3.__N[0] : f3.__[0], r3 = f3.t(t3, n3);
    o2(t3, r3) || (f3.__N = [r3, f3.__[1]], f3.__c.setState({}));
  }], f3.__c = r2, !r2.__f)) {
    r2.__f = true;
    var c3 = r2.shouldComponentUpdate;
    r2.shouldComponentUpdate = function(n3, t3, r3) {
      var u4 = this.__H;
      if (!u4) return true;
      var i4 = false, f4 = this.props != n3;
      if (u4.__.some(function(n4) {
        n4.__N && (i4 = true, o2(n4.__[0], n4.__N[0]) || (f4 = true));
      }), c3) {
        var e3 = c3.call(this, n3, t3, r3);
        return i4 ? e3 || f4 : e3;
      }
      return !i4 || f4;
    };
  }
  return f3.__;
}
function A2(n2, u3) {
  var i3 = y2(t2++, 3);
  !a2.__s && E2(i3.__H, u3) && (i3.__P = true, i3.__ = n2, i3.u = u3, r2.__H.__h.push(i3));
}
function F2(n2, u3) {
  var i3 = y2(t2++, 4);
  !a2.__s && E2(i3.__H, u3) && (i3.__P = false, i3.__ = n2, i3.u = u3, r2.__h.push(i3));
}
function T2(n2) {
  return f2 = 5, w2(function() {
    return { current: n2 };
  }, []);
}
function q2(n2, t3, r3) {
  f2 = 6, F2(function() {
    if ("function" == typeof n2) {
      var r4 = n2(t3());
      return function() {
        n2(null), r4 && "function" == typeof r4 && r4();
      };
    }
    if (n2) return n2.current = t3(), function() {
      return n2.current = null;
    };
  }, null == r3 ? r3 : r3.concat(n2));
}
function w2(n2, r3) {
  var u3 = y2(t2++, 7);
  return E2(u3.__H, r3) && (u3.__ = n2(), u3.__H = r3), u3.__;
}
function b2(n2, t3) {
  return f2 = 8, w2(function() {
    return n2;
  }, t3);
}
function j2(n2) {
  var u3 = r2.context[n2.__c], i3 = y2(t2++, 9);
  return i3.c = n2, u3 ? (null == i3.__ && (i3.__ = true, u3.sub(r2)), u3.props.value) : n2.__;
}
function x2(n2, t3) {
  a2.useDebugValue && a2.useDebugValue(t3 ? t3(n2) : n2);
}
function P2() {
  var n2 = y2(t2++, 11);
  if (!n2.__) {
    for (var u3 = r2.__v; !u3.__m && u3.__; ) u3 = u3.__;
    var i3 = u3.__m || (u3.__m = [0, 0]);
    n2.__ = "P" + i3[0] + "-" + i3[1]++;
  }
  return n2.__;
}
function g2() {
  var n2;
  do {
    for (; n2 = e2.shift(); ) try {
      C2(n2);
    } catch (t4) {
      a2.__e(t4, { __: (n2 = n2.__P) && n2.__v });
    }
    for (; n2 = c2.shift(); ) {
      var t3 = n2.__H;
      if (n2.__P && t3) try {
        t3.__h.some(C2), t3.__h.some(D2), t3.__h = [];
      } catch (r3) {
        t3.__h = [], a2.__e(r3, n2.__v);
      }
    }
  } while (e2.length);
}
a2.__b = function(n2) {
  r2 = null, v2 && v2(n2);
}, a2.__ = function(n2, t3) {
  n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), p2 && p2(n2, t3);
}, a2.__r = function(n2) {
  l2 && l2(n2), t2 = 0;
  var i3 = (r2 = n2.__c).__H;
  i3 && (u2 == r2 ? r2.__h = [] : (i3.__h.some(C2), i3.__h.some(D2), t2 = 0), i3.__h = [], i3.__.some(function(n3) {
    n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
  })), u2 = r2;
}, a2.diffed = function(n2) {
  m2 && m2(n2);
  var t3 = n2.__c;
  t3 && t3.__H && (t3.__H.__h.length && B2(c2.push(t3)), t3.__H.__.some(function(n3) {
    n3.u && (n3.__H = n3.u);
  })), u2 = r2 = null;
}, a2.__c = function(n2, t3) {
  t3.some(function(n3) {
    try {
      n3.__h.some(C2), n3.__h = n3.__h.filter(function(n4) {
        return !n4.__ || D2(n4);
      });
    } catch (t4) {
      n3.__h = [function() {
        throw t4;
      }];
    }
  }), h2 && h2(n2, t3);
}, a2.unmount = function(n2) {
  s2 && s2(n2);
  var t3, r3, u3 = n2.__c;
  u3 && u3.__H && (u3.__H.__.some(function(u4) {
    try {
      if (u4.__P && u4.__c) {
        if (void 0 === r3) {
          for (r3 = n2.__; r3 && (!r3.__c || !r3.__c.__P); ) r3 = r3.__;
          r3 = r3 && r3.__c;
        }
        u4.__P = r3, B2(e2.push(u4));
      } else C2(u4);
    } catch (n3) {
      t3 = n3;
    }
  }), u3.__H = void 0, t3 && a2.__e(t3, u3.__v));
};
var k2 = "function" == typeof requestAnimationFrame;
function z2(n2) {
  var t3, r3 = function() {
    clearTimeout(u3), k2 && cancelAnimationFrame(t3), setTimeout(n2);
  }, u3 = setTimeout(r3, 35);
  k2 && (t3 = requestAnimationFrame(r3));
}
function B2(n2) {
  1 != n2 && i2 == a2.requestAnimationFrame || ((i2 = a2.requestAnimationFrame) || z2)(g2);
}
function C2(n2) {
  var t3 = r2, u3 = n2.__c;
  "function" == typeof u3 && (n2.__c = void 0, u3()), r2 = t3;
}
function D2(n2) {
  var t3 = r2;
  n2.__c = n2.__(), r2 = t3;
}
function E2(n2, t3) {
  return !n2 || n2.length != t3.length || t3.some(function(t4, r3) {
    return !o2(t4, n2[r3]);
  });
}
function G2(n2, t3) {
  return "function" == typeof t3 ? t3(n2) : t3;
}

// node_modules/preact/compat/dist/compat.mjs
var S2 = function(t3, e3, r3) {
  return null == t3 ? null : A(A(t3).map(e3.bind(r3)));
};
var C3 = { map: S2, forEach: S2, count: function(t3) {
  return t3 ? A(t3).length : 0;
}, only: function(t3) {
  var e3 = A(t3);
  if (1 != e3.length) throw "Children.only";
  return e3[0];
}, toArray: A };
var w3 = Object.assign;
function R2(n2, t3) {
  for (var e3 in n2) if ("__source" != e3 && n2[e3] !== t3[e3]) return true;
  for (var r3 in t3) if ("__source" != r3 && !(r3 in n2)) return true;
  return false;
}
var x3 = /^(-|f[lo].*[^se]$|g.{5,}[^ps]$|z|o[pr]|(W.{5})?[lL]i.*(t|mp)$|an|(bo|s).{4}Im|sca|m.{6}[ds]|ta|c.*[st]$|wido|ini|asp|fill|st)/;
function O2() {
  function n2(n3, t3) {
    this.props = n3, this.context = t3;
  }
  return (n2.prototype = new x()).isPureReactComponent = true, n2.prototype.shouldComponentUpdate = function(n3, t3) {
    return R2(this.props, n3) || R2(this.state, t3);
  }, n2;
}
var I2 = /* @__PURE__ */ O2();
var j3 = /* @__PURE__ */ Symbol.for("react.forward_ref");
function k3(n2) {
  function t3(t4) {
    var e3 = w3({}, t4);
    return delete e3.ref, n2(e3, t4.ref || null);
  }
  return t3.$$typeof = j3, t3.render = n2, t3.prototype.isReactComponent = true, t3.displayName = "ForwardRef(" + (n2.displayName || n2.name) + ")", t3;
}
function M2(n2) {
  n2();
}
function D3(n2) {
  return n2;
}
function F3() {
  return [false, M2];
}
var L2 = F2;
function N2(n2) {
  var t3 = T2(n2);
  return t3.current = n2, function() {
    return t3.current.apply(void 0, arguments);
  };
}
function A3(n2, t3) {
  function r3(n3) {
    var e3 = this.props.ref;
    return e3 != n3.ref && e3 && ("function" == typeof e3 ? e3(null) : e3.current = null), t3 ? !t3(this.props, n3) || e3 != n3.ref : R2(this.props, n3);
  }
  function u3(t4) {
    return this.shouldComponentUpdate = r3, k(n2, t4);
  }
  return u3.displayName = "Memo(" + (n2.displayName || n2.name) + ")", u3.prototype.isReactComponent = true, u3.type = n2, u3;
}
function U2(n2, t3) {
  var e3 = W(n2, t3);
  return e3.containerInfo = t3, e3;
}
var V2;
var T3;
var W2;
var P3 = /* @__PURE__ */ Symbol.for("react.element");
var $2 = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(?!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/;
var z3 = /[A-Z0-9]/g;
var H2 = typeof document < "u";
var Z = /* @__PURE__ */ X(function(n2, t3, e3) {
  var r3 = n.__s || T3 ? (e3 || t3)() : t3(), i3 = d2({ t: { __: r3, u: t3 } }), o3 = i3[0].t, f3 = i3[1];
  return F2(function() {
    o3.__ = r3, o3.u = t3, B3(o3) && f3({ t: o3 });
  }, [n2, r3, t3]), A2(function() {
    return B3(o3) && f3({ t: o3 }), n2(function() {
      B3(o3) && f3({ t: o3 });
    });
  }, [n2]), r3;
});
function B3(n2) {
  try {
    return !Object.is(n2.__, n2.u());
  } catch (n3) {
    return true;
  }
}
var Y = function(n2) {
  return /fil|che|rad/.test(n2);
};
function q3(n2, t3, e3) {
  return null == t3.__k && (t3.textContent = ""), K(n2, t3), "function" == typeof e3 && e3(), n2 ? n2.__c : null;
}
function G3(n2, t3, e3) {
  return Q(n2, t3), "function" == typeof e3 && e3(), n2 ? n2.__c : null;
}
x.prototype.isReactComponent = true, ["componentWillMount", "componentWillReceiveProps", "componentWillUpdate"].forEach(function(n2) {
  Object.defineProperty(x.prototype, n2, { configurable: true, get: function() {
    return this["UNSAFE_" + n2];
  }, set: function(t3) {
    Object.defineProperty(this, n2, { configurable: true, writable: true, value: t3 });
  } });
});
var J2 = n.event;
n.event = function(n2) {
  return J2 && (n2 = J2(n2)), n2.persist = function() {
  }, n2.isPropagationStopped = function() {
    return this.cancelBubble;
  }, n2.isDefaultPrevented = function() {
    return this.defaultPrevented;
  }, n2.nativeEvent = n2;
};
var K2 = { configurable: true, get: function() {
  return this.class;
} };
var Q2 = n.vnode;
function X(n2) {
  if (!W2) {
    W2 = true;
    var t3 = n.__r;
    n.__r = function(n3) {
      t3 && t3(n3), 32 & n3.__u && (T3 = n3), V2 = n3.__c;
    };
    var e3 = n.diffed;
    n.diffed = function(n3) {
      e3 && e3(n3), V2 = null, T3 == n3 && (T3 = null);
    };
  }
  return n2;
}
n.vnode = function(t3) {
  if ("string" == typeof t3.type) !(function(t4) {
    var e4 = t4.props, r4 = t4.type, u3 = {}, i3 = -1 == r4.indexOf("-");
    for (var o3 in e4) {
      var f3 = e4[o3];
      if (!("value" == o3 && "defaultValue" in e4 && null == f3 || H2 && "children" == o3 && "noscript" == r4 || "class" == o3 || "className" == o3)) {
        if ("style" == o3 && f3 && f3.constructor == Object) {
          var a3 = void 0;
          for (var c3 in f3) "number" != typeof f3[c3] || x3.test(c3) || (a3 || (a3 = f3 = w3({}, f3)), f3[c3] += "px");
        } else if ("defaultValue" == o3 && "value" in e4 && null == e4.value) o3 = "value";
        else if ("download" == o3 && true === f3) f3 = "";
        else if ("translate" == o3 && "no" === f3) f3 = false;
        else if ("o" == o3[0] && "n" == o3[1]) {
          var l3 = o3.toLowerCase();
          "ondoubleclick" == l3 ? o3 = "ondblclick" : "onchange" != l3 || "input" != r4 && "textarea" != r4 || Y(e4.type) ? "onfocus" == l3 ? o3 = "onfocusin" : "onblur" == l3 && (o3 = "onfocusout") : l3 = o3 = "oninput", "oninput" == l3 && u3[o3 = l3] && (o3 = "oninputCapture");
        } else i3 && $2.test(o3) ? o3 = o3.replace(z3, "-$&").toLowerCase() : null === f3 && (f3 = void 0);
        u3[o3] = f3;
      }
    }
    "select" == r4 && (u3.multiple && Array.isArray(u3.value) && (u3.value = A(e4.children).forEach(function(n2) {
      n2.props.selected = -1 != u3.value.indexOf(n2.props.value);
    })), null != u3.defaultValue && (u3.value = A(e4.children).forEach(function(n2) {
      n2.props.selected = u3.multiple ? -1 != u3.defaultValue.indexOf(n2.props.value) : u3.defaultValue == n2.props.value;
    }))), e4.class && !e4.className ? (u3.class = e4.class, Object.defineProperty(u3, "className", K2)) : e4.className && (u3.class = u3.className = e4.className), t4.props = u3;
  })(t3);
  else if ("function" == typeof t3.type && ("ref" in t3.props && "prototype" in t3.type && t3.type.prototype.render && (t3.ref = t3.props.ref, delete t3.props.ref), t3.type.defaultProps)) {
    var e3 = w3({}, t3.props);
    for (var r3 in t3.type.defaultProps) void 0 === e3[r3] && (e3[r3] = t3.type.defaultProps[r3]);
    t3.props = e3;
  }
  t3.ref && !("ref" in t3.props) && Object.defineProperty(t3.props, "ref", { value: t3.ref, configurable: true, writable: true }), t3.$$typeof = P3, Q2 && Q2(t3);
};
var nn = /* @__PURE__ */ X(function(n2) {
  if (n2.then) {
    if ("fulfilled" == n2.status) return n2.value;
    if ("rejected" == n2.status) throw n2.reason;
    throw n2.status || (n2.status = "pending", n2.then(function(t4) {
      n2.status = "fulfilled", n2.value = t4;
    }, function(t4) {
      n2.status = "rejected", n2.reason = t4;
    })), n2;
  }
  var t3 = n2.__c, e3 = V2.__n[t3];
  return e3 ? (V2[t3] || (V2[t3] = true, e3.sub(V2)), e3.props.value) : n2.__;
});
var tn = { ReactCurrentDispatcher: { current: { readContext: nn, useCallback: b2, useContext: j2, useDebugValue: x2, useDeferredValue: D3, useEffect: A2, useId: P2, useImperativeHandle: q2, useInsertionEffect: L2, useLayoutEffect: F2, useMemo: w2, useReducer: _2, useRef: T2, useState: d2, useSyncExternalStore: Z, useTransition: F3 } } };
var en = /* @__PURE__ */ Symbol.for("pv");
function rn(n2, t3, e3) {
  if (n2) {
    var r3 = n2.__c && n2.__c.__H;
    r3 && (r3.__.forEach(function(n3) {
      null != n3.__P && ("function" == typeof n3.__c && n3.__c(), n3.__c = n3.__H = void 0);
    }), r3.__h = n2.__c.__h = []), "string" == typeof n2.type && (n2.__u |= 8), null != (n2 = w3({ constructor: en }, n2)).__c && (n2.__c.__P == e3 && (n2.__c.__P = t3), n2.__c.__g |= 4, n2.__c = n2.ref = null), n2.__k = n2.__k && n2.__k.map(function(n3) {
      return rn(n3, t3, e3);
    });
  }
  return n2;
}
function un(n2, t3, e3) {
  return n2 && e3 && ("string" == typeof n2.type && (n2.__u |= 1), n2.__v = null, n2.__k = n2.__k && n2.__k.map(function(n3) {
    return un(n3, t3, e3);
  }), n2.__c && n2.__c.__P == t3 && (n2.__e && e3.appendChild(n2.__e), n2.__c.__g |= 4, n2.__c.__P = e3)), n2;
}
function on() {
  function n2() {
    this.__u = 0, this.i = null, this.__b = null;
  }
  return (function() {
    var n3 = n.__e;
    n.__e = function(t4, e3, r3, u3) {
      if (t4.then) {
        for (var i3, o3 = e3; o3 = o3.__; ) if ((i3 = o3.__c) && i3.__c) return r3 && !r3.__c && (e3.__c.__H = void 0), i3.__c(t4, e3);
      }
      n3(t4, e3, r3, u3);
    };
    var t3 = n.unmount;
    n.unmount = function(n4) {
      var e3 = n4.__c;
      e3 && e3.__R && e3.__R(), t3 && t3(n4);
    };
  })(), (n2.prototype = new x()).__c = function(n3, t3) {
    var e3 = this, r3 = t3.__c;
    null == this.i && (this.i = []), this.i.push(r3);
    var u3 = false, i3 = function() {
      !u3 && e3.__P && (u3 = true, r3.__R = null, f3());
    };
    r3.__R = i3;
    var o3 = r3.__P;
    r3.__P = null;
    var f3 = function() {
      if (!--e3.__u) {
        if (e3.state.__a) {
          var n4 = e3.state.__a;
          e3.__v.__k[0] = un(n4, n4.__c.__P, n4.__c.__O);
        }
        var t4;
        for (e3.setState({ __a: e3.__b = null }); t4 = e3.i.pop(); ) t4.__P = o3, t4.forceUpdate();
      }
    };
    this.__u++ || 32 & t3.__u || this.setState({ __a: this.__b = this.__v.__k[0] }), n3.then(i3, i3);
  }, n2.prototype.componentWillUnmount = function() {
    this.i = [], this.state.__a && (this.__v.__k[0] = this.state.__a);
  }, n2.prototype.render = function(n3, t3) {
    if (this.__b) {
      if (this.__v.__k) {
        var r3 = document.createElement("div"), u3 = this.__v.__k[0].__c;
        this.__v.__k[0] = rn(this.__b, r3, u3.__O = u3.__P);
      }
      this.__b = null;
    }
    return [k(M, null, t3.__a ? null : n3.children), t3.__a && k(M, null, n3.fallback)];
  }, n2;
}
var fn = /* @__PURE__ */ on();
function an(n2) {
  var t3, r3, u3, i3 = null;
  function o3(o4) {
    if (t3 || (t3 = n2()).then(function(n3) {
      n3 && (i3 = n3.default || n3), u3 = true;
    }, function(n3) {
      r3 = n3, u3 = true;
    }), r3) throw r3;
    if (!u3) throw t3;
    return i3 ? k(i3, o4) : null;
  }
  return o3.displayName = "Lazy", o3;
}
function ln(n2) {
  return k.bind(null, n2);
}
function sn(n2) {
  return !!n2 && n2.$$typeof === P3;
}
function vn(n2) {
  return sn(n2) && n2.type == M;
}
function hn(n2) {
  return !!n2 && "string" == typeof n2.displayName && 0 == n2.displayName.indexOf("Memo(");
}
function dn(n2) {
  return sn(n2) ? b.apply(null, arguments) : n2;
}
function pn(n2) {
  return !!n2.__k && (K(null, n2), true);
}
function mn(n2) {
  return n2 && (n2.__v && n2.__v.__e || 1 == n2.nodeType && n2) || null;
}
var yn = function(n2, t3) {
  var e3, r3 = n.debounceRendering;
  n.debounceRendering = function(n3) {
    e3 = n3;
  };
  try {
    var i3 = n2(t3);
    return e3 && e3(), i3;
  } finally {
    n.debounceRendering = r3;
  }
};
function bn(n2, t3) {
  return n2(t3);
}
var _n = { useState: d2, useId: P2, useReducer: _2, useEffect: A2, useLayoutEffect: F2, useInsertionEffect: L2, useTransition: F3, useDeferredValue: D3, useSyncExternalStore: Z, useEffectEvent: N2, startTransition: M2, useRef: T2, useImperativeHandle: q2, useMemo: w2, useCallback: b2, useContext: j2, use: nn, useDebugValue: x2, version: "19.0.0", Children: C3, render: q3, hydrate: G3, unmountComponentAtNode: pn, createPortal: U2, createElement: k, createContext: R, createFactory: ln, cloneElement: dn, createRef: $, Fragment: M, isValidElement: sn, isElement: sn, isFragment: vn, isMemo: hn, findDOMNode: mn, Component: x, PureComponent: I2, memo: A3, forwardRef: k3, flushSync: yn, unstable_batchedUpdates: bn, StrictMode: M, Suspense: fn, lazy: an, __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: tn };

// src/index.jsx
import { initializeApp as _initApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAuth as _getAuth, signInAnonymously as _signInAnon } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";
import { getFirestore as _getFirestore, doc as _doc, getDocFromServer as _getDocFromServer, collection as _collection, onSnapshot as _onSnapshot, updateDoc as _updateDoc, setDoc as _setDoc, deleteDoc as _deleteDoc } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";
import { firebaseConfig as _fbConfig } from "./firebase-config.js";

// src/components/Icons.jsx
var PlayIcon = ({ size = 14, color = "#E50914" }) => /* @__PURE__ */ _n.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ _n.createElement("path", { d: "M8 5v14l11-7z" }));
var CheckIcon = ({ size = 13, color = "#FFFFFF" }) => /* @__PURE__ */ _n.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ _n.createElement("path", { d: "M20 6L9 17l-5-5" }));
var ClockIcon = ({ size = 13, color = "#CCCCCC" }) => /* @__PURE__ */ _n.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ _n.createElement("circle", { cx: "12", cy: "12", r: "9" }), /* @__PURE__ */ _n.createElement("path", { d: "M12 7v5l3 3" }));
var TrashIcon = ({ size = 14, color = "#888888" }) => /* @__PURE__ */ _n.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ _n.createElement("path", { d: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" }));
var SearchIcon = ({ size = 14, color = "#777777" }) => /* @__PURE__ */ _n.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ _n.createElement("path", { d: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" }));
var CloseIcon = ({ size = 14, color = "#888888" }) => /* @__PURE__ */ _n.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ _n.createElement("path", { d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" }));
var RefreshIcon = ({ size = 15, color = "#FFFFFF" }) => /* @__PURE__ */ _n.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ _n.createElement("path", { d: "M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.67-.8" }));
var LockIcon = ({ size = 15, color = "#FFFFFF" }) => /* @__PURE__ */ _n.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ _n.createElement("rect", { x: "5", y: "11", width: "14", height: "10", rx: "2" }), /* @__PURE__ */ _n.createElement("path", { d: "M8 11V7a4 4 0 0 1 8 0v4" }), /* @__PURE__ */ _n.createElement("circle", { cx: "12", cy: "16", r: "1.2", fill: color }));
var ShieldIcon = ({ size = 16, color = "#E50914" }) => /* @__PURE__ */ _n.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ _n.createElement("path", { d: "M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" }), /* @__PURE__ */ _n.createElement("path", { d: "M9 12l2 2 4-4" }));
var DeviceIcon = ({ size = 16, color = "#CCCCCC" }) => /* @__PURE__ */ _n.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ _n.createElement("rect", { x: "5", y: "2", width: "14", height: "20", rx: "3" }), /* @__PURE__ */ _n.createElement("path", { d: "M11 18h2", strokeWidth: "2" }));
var TvIcon = ({ size = 16, color = "#CCCCCC" }) => /* @__PURE__ */ _n.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ _n.createElement("rect", { x: "2", y: "5", width: "20", height: "14", rx: "2" }), /* @__PURE__ */ _n.createElement("path", { d: "M12 19v3M8 22h8" }));
var AndroidIcon = ({ size = 16, color = "#10B981" }) => /* @__PURE__ */ _n.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ _n.createElement("path", { d: "M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.72 2.24 12.88 2 12 2c-.88 0-1.72.24-2.64.63L7.88.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.3 1.3C6.67 3.33 5.34 5.25 5.06 7.5h13.88c-.28-2.25-1.61-4.17-3.41-5.34zM9 5.5c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75zm6 0c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75z" }));
var AppleIcon = ({ size = 16, color = "#E0E0E6" }) => /* @__PURE__ */ _n.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: color }, /* @__PURE__ */ _n.createElement("path", { d: "M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.58-.7.97-1.68.86-2.66-.84.03-1.85.56-2.44 1.25-.52.59-.97 1.55-.85 2.48.93.07 1.86-.49 2.43-1.07z" }));
var ExportIcon = ({ size = 14, color = "#CCCCCC" }) => /* @__PURE__ */ _n.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ _n.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" }));

// src/components/LockScreen.jsx
var LockScreen = ({ hidden = false, onUnlock, db: db2, doc: doc2, getDocFromServer: getDocFromServer2, auth: auth2, signInWithCustomToken }) => {
  const [pin, setPin] = d2("");
  const [error, setError] = d2("");
  const [busy, setBusy] = d2(false);
  const updateDots = (len) => {
    const dots = document.getElementById("pin-dots");
    if (dots) {
      dots.setAttribute("aria-label", `${len} of 4 digits entered`);
      [...dots.children].forEach((dot, i3) => {
        if (i3 < len) {
          dot.classList.add("filled");
        } else {
          dot.classList.remove("filled");
        }
      });
    }
  };
  const handleSubmit = async (pinValue) => {
    const inputEl = document.getElementById("pin");
    const val = pinValue || inputEl?.value || "";
    if (busy || val.length !== 4) {
      return;
    }
    setBusy(true);
    setError("");
    const errEl = document.getElementById("login-error");
    if (errEl) errEl.textContent = "";
    try {
      let loggedIn = false;
      if (typeof fetch === "function") {
        try {
          const res = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin: val })
          });
          if (res && res.ok) {
            const data = await res.json();
            if (data && data.token) {
              if (auth2 && typeof signInWithCustomToken === "function") {
                await signInWithCustomToken(auth2, data.token);
              }
              loggedIn = true;
            }
          }
        } catch {
        }
      }
      if (!loggedIn) {
        let targetPin = null;
        try {
          const snap1 = await getDocFromServer2(doc2(db2, "app_config", "security"));
          if (snap1 && (typeof snap1.exists === "function" ? snap1.exists() : snap1.exists)) {
            const d1 = typeof snap1.data === "function" ? snap1.data() : typeof snap1.data === "object" ? snap1.data : {};
            const dataObj = typeof d1 === "function" ? d1() : d1;
            targetPin = String(dataObj.pin !== void 0 ? dataObj.pin : dataObj.password !== void 0 ? dataObj.password : "").trim();
          }
        } catch {
        }
        if (!targetPin) {
          try {
            const snap2 = await getDocFromServer2(doc2(db2, "admin_settings", "security"));
            if (snap2 && (typeof snap2.exists === "function" ? snap2.exists() : snap2.exists)) {
              const d22 = typeof snap2.data === "function" ? snap2.data() : typeof snap2.data === "object" ? snap2.data : {};
              const dataObj = typeof d22 === "function" ? d22() : d22;
              targetPin = String(dataObj.pin !== void 0 ? dataObj.pin : dataObj.password !== void 0 ? dataObj.password : "").trim();
            }
          } catch {
          }
        }
        if (!targetPin) targetPin = "1234";
        if (val !== targetPin) {
          throw new Error("Incorrect PIN. Please try again.");
        }
      }
      try {
        sessionStorage.setItem("meflix_admin_auth", "true");
      } catch {
      }
      setPin("");
      if (inputEl) inputEl.value = "";
      updateDots(0);
      const ws = document.getElementById("workspace");
      if (ws) ws.hidden = false;
      const lk = document.getElementById("lock");
      if (lk) lk.hidden = true;
      onUnlock();
    } catch (err) {
      const msg = err.message || "Unable to unlock console.";
      setError(msg);
      if (errEl) errEl.textContent = msg;
      setPin("");
      if (inputEl) inputEl.value = "";
      updateDots(0);
    } finally {
      setBusy(false);
    }
  };
  const handleDigit = (digit) => {
    if (busy) return;
    setError("");
    const errEl = document.getElementById("login-error");
    if (errEl) errEl.textContent = "";
    const inputEl = document.getElementById("pin");
    const currentVal = inputEl?.value || "";
    const nextPin = (currentVal + digit).slice(0, 4);
    if (inputEl) inputEl.value = nextPin;
    setPin(nextPin);
    updateDots(nextPin.length);
    if (nextPin.length === 4) {
      handleSubmit(nextPin);
    }
  };
  const handleBackspace = () => {
    if (busy) return;
    setError("");
    const errEl = document.getElementById("login-error");
    if (errEl) errEl.textContent = "";
    const inputEl = document.getElementById("pin");
    const currentVal = inputEl?.value || "";
    const nextPin = currentVal.slice(0, -1);
    if (inputEl) inputEl.value = nextPin;
    setPin(nextPin);
    updateDots(nextPin.length);
  };
  A2(() => {
    const handleKeyDown = (e3) => {
      if (hidden || busy || e3.ctrlKey || e3.metaKey || e3.altKey) return;
      if (/^[0-9]$/.test(e3.key)) {
        e3.preventDefault();
        handleDigit(e3.key);
      } else if (e3.key === "Backspace") {
        e3.preventDefault();
        handleBackspace();
      } else if (e3.key === "Enter") {
        e3.preventDefault();
        const inputEl = document.getElementById("pin");
        handleSubmit(inputEl?.value || pin);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, busy, hidden]);
  return /* @__PURE__ */ _n.createElement("main", { id: "lock", className: "pin-lock", hidden }, /* @__PURE__ */ _n.createElement("div", { className: "privacy-panel" }, /* @__PURE__ */ _n.createElement("div", { className: "brand-logo-wrap" }, /* @__PURE__ */ _n.createElement("div", { className: "brand-mark-box" }, /* @__PURE__ */ _n.createElement(ShieldIcon, { size: 22, color: "#FFFFFF" })), /* @__PURE__ */ _n.createElement("div", { className: "brand-copy" }, /* @__PURE__ */ _n.createElement("div", { className: "brand-top-row" }, /* @__PURE__ */ _n.createElement("span", { className: "brand-title" }, "MEFLIX CONSOLE"), /* @__PURE__ */ _n.createElement("span", { className: "admin-pill" }, "ADMIN")), /* @__PURE__ */ _n.createElement("span", { className: "brand-sub" }, "Device Authorization & Security"))), /* @__PURE__ */ _n.createElement("h1", null, "Enter privacy password"), /* @__PURE__ */ _n.createElement("p", { className: "lock-desc" }, "Enter your 4-digit password to unlock the admin console."), /* @__PURE__ */ _n.createElement(
    "form",
    {
      id: "login-form",
      ref: (form) => {
        if (form && !form._hasNativeSubmit) {
          form._hasNativeSubmit = true;
          form.addEventListener("submit", (e3) => {
            e3.preventDefault();
            const inputEl = document.getElementById("pin");
            handleSubmit(inputEl?.value || pin);
          });
        }
      },
      onSubmit: (e3) => {
        e3.preventDefault();
        const inputEl = document.getElementById("pin");
        handleSubmit(inputEl?.value || pin);
      }
    },
    /* @__PURE__ */ _n.createElement(
      "input",
      {
        id: "pin",
        type: "password",
        readOnly: true,
        inputMode: "numeric",
        pattern: "[0-9]{4}",
        minLength: 4,
        maxLength: 4,
        autoComplete: "off",
        "aria-label": "4-digit admin PIN",
        className: "sr-only",
        value: pin
      }
    ),
    /* @__PURE__ */ _n.createElement("div", { id: "pin-dots", className: "pin-dots", "aria-label": `${pin.length} of 4 digits entered` }, [0, 1, 2, 3].map((i3) => /* @__PURE__ */ _n.createElement("span", { key: i3, className: i3 < pin.length ? "filled" : "" }))),
    /* @__PURE__ */ _n.createElement("p", { id: "login-error", role: "alert", className: "pin-error" }, error),
    /* @__PURE__ */ _n.createElement("div", { id: "keypad", className: "keypad", "aria-label": "Numeric keypad" }, ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d3) => /* @__PURE__ */ _n.createElement(
      "button",
      {
        key: d3,
        type: "button",
        "data-digit": d3,
        disabled: busy,
        onClick: () => handleDigit(d3)
      },
      d3
    )), /* @__PURE__ */ _n.createElement("span", { "aria-hidden": "true" }), /* @__PURE__ */ _n.createElement(
      "button",
      {
        type: "button",
        "data-digit": "0",
        disabled: busy,
        onClick: () => handleDigit("0")
      },
      "0"
    ), /* @__PURE__ */ _n.createElement(
      "button",
      {
        id: "backspace",
        type: "button",
        className: "backspace",
        "aria-label": "Backspace",
        disabled: busy,
        onClick: handleBackspace
      },
      "\u232B"
    )),
    /* @__PURE__ */ _n.createElement("button", { id: "sign-in", type: "submit", className: "sr-only", tabIndex: -1, disabled: busy }, "Unlock console")
  )));
};

// src/components/TopBar.jsx
var TopBar = ({ streamingCount, onRefresh, onLock, onExport }) => {
  return /* @__PURE__ */ _n.createElement("header", { className: "topbar" }, /* @__PURE__ */ _n.createElement("div", { className: "topbar-left" }, /* @__PURE__ */ _n.createElement("div", { className: "brand-mark-box" }, /* @__PURE__ */ _n.createElement(ShieldIcon, { size: 18, color: "#FFFFFF" })), /* @__PURE__ */ _n.createElement("div", { className: "brand-text-col" }, /* @__PURE__ */ _n.createElement("div", { className: "brand-top-row" }, /* @__PURE__ */ _n.createElement("span", { className: "brand-title" }, "MEFLIX CONSOLE"), /* @__PURE__ */ _n.createElement("span", { className: "admin-pill" }, "ADMIN"), streamingCount > 0 && /* @__PURE__ */ _n.createElement("div", { id: "active-indicator", className: "live-indicator" }, /* @__PURE__ */ _n.createElement("span", { className: "green-dot" }), /* @__PURE__ */ _n.createElement("span", { id: "active-count", className: "live-indicator-text" }, streamingCount, " Active"))), /* @__PURE__ */ _n.createElement("span", { className: "brand-sub" }, "Device Authorization & Security"))), /* @__PURE__ */ _n.createElement("div", { className: "topbar-right" }, /* @__PURE__ */ _n.createElement(
    "button",
    {
      id: "export",
      type: "button",
      className: "top-btn",
      title: "Export devices to CSV",
      onClick: onExport
    },
    /* @__PURE__ */ _n.createElement(ExportIcon, { size: 13, color: "#D0D0D8" }),
    /* @__PURE__ */ _n.createElement("span", { className: "btn-label-desktop" }, "Export")
  ), /* @__PURE__ */ _n.createElement(
    "button",
    {
      id: "refresh",
      type: "button",
      className: "top-btn",
      title: "Refresh device updates",
      onClick: onRefresh
    },
    /* @__PURE__ */ _n.createElement(RefreshIcon, { size: 14, color: "#D0D0D8" }),
    /* @__PURE__ */ _n.createElement("span", { className: "btn-label-desktop" }, "Refresh")
  ), /* @__PURE__ */ _n.createElement(
    "button",
    {
      id: "logout",
      type: "button",
      className: "top-btn top-btn-danger",
      title: "Lock console",
      onClick: onLock
    },
    /* @__PURE__ */ _n.createElement(LockIcon, { size: 13, color: "#FF6B6B" }),
    /* @__PURE__ */ _n.createElement("span", { className: "btn-label-desktop" }, "Lock")
  )), /* @__PURE__ */ _n.createElement("div", { style: { display: "none" } }, /* @__PURE__ */ _n.createElement(
    "button",
    {
      id: "security-top",
      type: "button",
      ref: (btn) => {
        if (btn && !btn._hasNativeClick) {
          btn._hasNativeClick = true;
          btn.addEventListener("click", () => {
            const b3 = document.getElementById("tab-pin");
            if (b3) b3.click();
          });
        }
      },
      onClick: () => {
        const btn = document.getElementById("tab-pin");
        if (btn) btn.click();
      }
    }
  ), /* @__PURE__ */ _n.createElement(
    "button",
    {
      id: "security-nav",
      type: "button",
      ref: (btn) => {
        if (btn && !btn._hasNativeClick) {
          btn._hasNativeClick = true;
          btn.addEventListener("click", () => {
            const b3 = document.getElementById("tab-pin");
            if (b3) b3.click();
          });
        }
      },
      onClick: () => {
        const btn = document.getElementById("tab-pin");
        if (btn) btn.click();
      }
    }
  ), /* @__PURE__ */ _n.createElement(
    "button",
    {
      id: "devices-nav",
      type: "button",
      ref: (btn) => {
        if (btn && !btn._hasNativeClick) {
          btn._hasNativeClick = true;
          btn.addEventListener("click", () => {
            const b3 = document.getElementById("tab-all");
            if (b3) b3.click();
          });
        }
      },
      onClick: () => {
        const btn = document.getElementById("tab-all");
        if (btn) btn.click();
      }
    }
  ), /* @__PURE__ */ _n.createElement(
    "button",
    {
      id: "updates-nav",
      type: "button",
      ref: (btn) => {
        if (btn && !btn._hasNativeClick) {
          btn._hasNativeClick = true;
          btn.addEventListener("click", () => {
            const u3 = document.getElementById("updates");
            if (u3) {
              if (typeof u3.showModal === "function") u3.showModal();
              u3.open = true;
            }
          });
        }
      },
      onClick: () => {
        const u3 = document.getElementById("updates");
        if (u3) {
          if (typeof u3.showModal === "function") u3.showModal();
          u3.open = true;
        }
      }
    }
  )));
};

// src/components/StatsRow.jsx
var StatsRow = ({ devices, whitelistedIps, currentTab, onSelectTab, isStreaming: isStreaming2 }) => {
  const streamingCount = devices.filter(isStreaming2).length;
  const pendingCount = devices.filter((d3) => d3.status === "pending").length;
  const ipsCount = whitelistedIps.length;
  const kpis = [
    {
      id: "all",
      countId: "count-all",
      label: "TOTAL DEVICES",
      num: devices.length,
      sub: "Tracked in system",
      color: "#FFFFFF",
      hasDot: false
    },
    {
      id: "watching",
      countId: "count-watching",
      label: "STREAMING NOW",
      num: streamingCount,
      sub: streamingCount > 0 ? "Active viewers" : "Idle",
      color: streamingCount > 0 ? "#46D369" : "#FFFFFF",
      hasDot: streamingCount > 0
    },
    {
      id: "pending",
      countId: "count-pending",
      label: "PENDING APPROVAL",
      num: pendingCount,
      sub: pendingCount > 0 ? "Needs action" : "Queue clear",
      color: pendingCount > 0 ? "#FFA726" : "#FFFFFF",
      hasDot: false
    },
    {
      id: "whitelist",
      countId: "count-whitelist",
      label: "IP WHITELIST",
      num: ipsCount,
      sub: "Network passes",
      color: "#FFFFFF",
      hasDot: false
    }
  ];
  return /* @__PURE__ */ _n.createElement("div", { id: "stats", className: "stats-grid" }, kpis.map((k4) => /* @__PURE__ */ _n.createElement(
    "div",
    {
      key: k4.id,
      className: `stat-card stat-card-${k4.id} ${currentTab === k4.id ? "active" : ""}`,
      role: "button",
      tabIndex: 0,
      onClick: () => onSelectTab(k4.id),
      onKeyDown: (e3) => {
        if (e3.key === "Enter" || e3.key === " ") onSelectTab(k4.id);
      }
    },
    /* @__PURE__ */ _n.createElement("div", { className: "stat-label-row" }, /* @__PURE__ */ _n.createElement("span", { className: "stat-label" }, k4.label), k4.hasDot && /* @__PURE__ */ _n.createElement("span", { className: "green-dot" })),
    /* @__PURE__ */ _n.createElement("div", { id: k4.countId, className: "stat-number", style: { color: k4.color } }, k4.num),
    /* @__PURE__ */ _n.createElement("div", { className: "stat-sub" }, k4.sub)
  )));
};

// src/components/NavTabs.jsx
var NavTabs = ({
  currentTab,
  onSelectTab,
  totalCount,
  streamingCount,
  pendingCount,
  whitelistCount,
  searchQuery,
  onSearchChange,
  isDeviceView
}) => {
  const handleTabClick = (tabId) => {
    onSelectTab(tabId);
    const viewDevices = document.getElementById("view-devices");
    const viewWhitelist = document.getElementById("view-whitelist");
    const viewPin = document.getElementById("view-pin");
    const searchBox = document.getElementById("search-box");
    if (tabId === "all" || tabId === "watching" || tabId === "pending") {
      if (viewDevices) viewDevices.hidden = false;
      if (viewWhitelist) viewWhitelist.hidden = true;
      if (viewPin) viewPin.hidden = true;
      if (searchBox) searchBox.hidden = false;
    } else if (tabId === "whitelist") {
      if (viewDevices) viewDevices.hidden = true;
      if (viewWhitelist) viewWhitelist.hidden = false;
      if (viewPin) viewPin.hidden = true;
      if (searchBox) searchBox.hidden = true;
    } else if (tabId === "pin") {
      if (viewDevices) viewDevices.hidden = true;
      if (viewWhitelist) viewWhitelist.hidden = true;
      if (viewPin) viewPin.hidden = false;
      if (searchBox) searchBox.hidden = true;
    }
  };
  return /* @__PURE__ */ _n.createElement("div", { className: "menu-row" }, /* @__PURE__ */ _n.createElement("div", { className: "tab-scroll" }, /* @__PURE__ */ _n.createElement(
    "button",
    {
      id: "tab-all",
      type: "button",
      className: `tab-btn ${currentTab === "all" ? "active" : ""}`,
      onClick: () => handleTabClick("all")
    },
    "All Devices (",
    totalCount,
    ")"
  ), /* @__PURE__ */ _n.createElement(
    "button",
    {
      id: "tab-watching",
      type: "button",
      className: `tab-btn ${currentTab === "watching" ? "active" : ""}`,
      onClick: () => handleTabClick("watching")
    },
    /* @__PURE__ */ _n.createElement("span", { className: "tab-btn-watching-wrap" }, /* @__PURE__ */ _n.createElement("span", { className: "green-dot" }), "Watching (", streamingCount, ")")
  ), /* @__PURE__ */ _n.createElement(
    "button",
    {
      id: "tab-pending",
      type: "button",
      className: `tab-btn ${currentTab === "pending" ? "active" : ""}`,
      onClick: () => handleTabClick("pending")
    },
    "Pending (",
    pendingCount,
    ")"
  ), /* @__PURE__ */ _n.createElement(
    "button",
    {
      id: "tab-whitelist",
      type: "button",
      className: `tab-btn ${currentTab === "whitelist" ? "active" : ""}`,
      onClick: () => handleTabClick("whitelist")
    },
    "IP Whitelist (",
    whitelistCount,
    ")"
  ), /* @__PURE__ */ _n.createElement(
    "button",
    {
      id: "tab-pin",
      type: "button",
      className: `tab-btn ${currentTab === "pin" ? "active" : ""}`,
      onClick: () => handleTabClick("pin")
    },
    "Security PIN"
  )), /* @__PURE__ */ _n.createElement("div", { id: "search-box", className: "compact-search", hidden: !isDeviceView }, /* @__PURE__ */ _n.createElement(SearchIcon, { size: 14, color: "#777777" }), /* @__PURE__ */ _n.createElement(
    "input",
    {
      id: "search",
      ref: (el) => {
        if (el && !el._hasInputListener) {
          el._hasInputListener = true;
          el.addEventListener("input", (e3) => {
            onSearchChange(e3.target ? e3.target.value : el.value);
          });
        }
      },
      type: "search",
      value: searchQuery,
      onInput: (e3) => onSearchChange(e3.target.value || document.getElementById("search")?.value || ""),
      onChange: (e3) => onSearchChange(e3.target.value || document.getElementById("search")?.value || ""),
      placeholder: "Search name, IP, title, ID...",
      className: "compact-search-input",
      "aria-label": "Search devices"
    }
  ), searchQuery ? /* @__PURE__ */ _n.createElement(
    "button",
    {
      type: "button",
      className: "search-clear-btn",
      onClick: () => onSearchChange(""),
      "aria-label": "Clear search"
    },
    /* @__PURE__ */ _n.createElement(CloseIcon, { size: 12, color: "#888888" })
  ) : null));
};

// src/components/DeviceCard.jsx
function formatAgo(timestamp, now = Date.now()) {
  if (!timestamp) return "Never";
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1e3));
  if (diffSec < 60) return "Just now";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diffSec / 3600);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
function getDevicePresence(device, now = Date.now()) {
  const isStreaming2 = Boolean(device.isWatching && device.lastActiveAt && now - device.lastActiveAt < 3e5);
  if (isStreaming2) {
    return {
      type: "streaming",
      label: "STREAMING NOW",
      dotClass: "green-dot-pulse",
      pillClass: "pill-streaming",
      color: "#10B981"
    };
  }
  const lastActive = device.lastActiveAt || device.requestedAt;
  const diff = lastActive ? now - lastActive : Infinity;
  if (diff < 6e5) {
    return {
      type: "online",
      label: "ONLINE",
      dotClass: "green-dot",
      pillClass: "pill-online",
      color: "#10B981"
    };
  }
  if (diff < 864e5) {
    return {
      type: "idle",
      label: "IDLE",
      dotClass: "amber-dot",
      pillClass: "pill-idle",
      color: "#F59E0B"
    };
  }
  return {
    type: "offline",
    label: "OFFLINE",
    dotClass: "gray-dot",
    pillClass: "pill-offline",
    color: "#64748B"
  };
}
var DeviceCard = ({
  device,
  isStreaming: isStreaming2,
  expirationDetails,
  relativeTime: relativeTime2,
  onOpenDetails,
  onOpenHistory,
  onQuickApprove,
  onRevoke,
  onDelete
}) => {
  const watching = isStreaming2(device);
  const exp = expirationDetails;
  const historyList = Array.isArray(device.watchHistory) ? device.watchHistory : [];
  const historyCount = device.watchCount || historyList.length;
  const latestWatched = historyList.length > 0 ? historyList[historyList.length - 1] : null;
  const presence = getDevicePresence(device);
  const getPlatformDetails = () => {
    const p3 = (device.platform || "").toLowerCase();
    if (p3.includes("tv") || p3.includes("fire") || p3.includes("androidtv")) {
      return { icon: /* @__PURE__ */ _n.createElement(TvIcon, { size: 18, color: "#FF4D58" }), glyphCls: "glyph-tv", name: device.platform || "Smart TV" };
    }
    if (p3.includes("apple") || p3.includes("ios") || p3.includes("iphone") || p3.includes("ipad")) {
      return { icon: /* @__PURE__ */ _n.createElement(AppleIcon, { size: 18, color: "#E2E8F0" }), glyphCls: "glyph-apple", name: device.platform || "Apple iOS" };
    }
    if (p3.includes("android")) {
      return { icon: /* @__PURE__ */ _n.createElement(AndroidIcon, { size: 18, color: "#10B981" }), glyphCls: "glyph-android", name: device.platform || "Android" };
    }
    return { icon: /* @__PURE__ */ _n.createElement(DeviceIcon, { size: 18, color: "#94A3B8" }), glyphCls: "glyph-device", name: device.platform || "Device" };
  };
  const platformMeta = getPlatformDetails();
  const formattedRegDate = device.requestedAt ? new Date(device.requestedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "Unknown";
  const regAgo = device.requestedAt ? formatAgo(device.requestedAt) : "";
  const activeAgo = formatAgo(device.lastActiveAt || device.requestedAt);
  return /* @__PURE__ */ _n.createElement(
    "div",
    {
      className: "device-card device-row",
      "aria-label": `Manage ${device.name || device.deviceId}`,
      ref: (el) => {
        if (el && !el._hasClick) {
          el._hasClick = true;
          el.addEventListener("click", (e3) => {
            if (e3 && e3.target && e3.target.closest && e3.target.closest("button")) return;
            onOpenDetails(device.deviceId);
          });
        }
      },
      onClick: (e3) => {
        if (e3 && e3.target && e3.target.closest && e3.target.closest("button")) return;
        onOpenDetails(device.deviceId);
      }
    },
    /* @__PURE__ */ _n.createElement("div", { className: "card-header" }, /* @__PURE__ */ _n.createElement("div", { className: "card-header-main" }, /* @__PURE__ */ _n.createElement("div", { className: `device-glyph ${platformMeta.glyphCls}` }, platformMeta.icon), /* @__PURE__ */ _n.createElement("div", { className: "device-meta-col" }, /* @__PURE__ */ _n.createElement("div", { className: "name-row" }, /* @__PURE__ */ _n.createElement("strong", { className: "device-name" }, device.name || "Unnamed device"), /* @__PURE__ */ _n.createElement("div", { className: `presence-pill ${presence.pillClass}` }, /* @__PURE__ */ _n.createElement("span", { className: `presence-dot ${presence.dotClass}` }), /* @__PURE__ */ _n.createElement("span", { className: "presence-label" }, presence.label))), /* @__PURE__ */ _n.createElement("div", { className: "platform-meta" }, /* @__PURE__ */ _n.createElement("span", null, "Platform: ", /* @__PURE__ */ _n.createElement("strong", { className: "white-text" }, platformMeta.name)), /* @__PURE__ */ _n.createElement("span", { className: "meta-separator" }, "\u2022"), /* @__PURE__ */ _n.createElement("span", null, "Registered: ", /* @__PURE__ */ _n.createElement("strong", { className: "white-text" }, formattedRegDate)), regAgo ? /* @__PURE__ */ _n.createElement("span", { className: "meta-ago" }, "(", regAgo, ")") : null))), /* @__PURE__ */ _n.createElement("div", { className: "status-col" }, watching ? /* @__PURE__ */ _n.createElement("div", { className: "watching-now-badge" }, /* @__PURE__ */ _n.createElement("span", { className: "green-dot-pulse" }), /* @__PURE__ */ _n.createElement("span", null, "WATCHING NOW")) : /* @__PURE__ */ _n.createElement("div", { className: `status-tag ${exp.cls}`, style: { borderColor: exp.badgeColor, color: exp.badgeColor } }, exp.badge))),
    /* @__PURE__ */ _n.createElement("div", { className: "details-grid" }, /* @__PURE__ */ _n.createElement("div", { className: "detail-block" }, /* @__PURE__ */ _n.createElement("span", { className: "detail-label" }, "IP ADDRESS"), /* @__PURE__ */ _n.createElement("span", { className: "detail-mono" }, device.ip || "Not recorded")), /* @__PURE__ */ _n.createElement("div", { className: "detail-block" }, /* @__PURE__ */ _n.createElement("span", { className: "detail-label" }, "DEVICE ID"), /* @__PURE__ */ _n.createElement("span", { className: "detail-mono" }, device.deviceId)), /* @__PURE__ */ _n.createElement("div", { className: "detail-block" }, /* @__PURE__ */ _n.createElement("span", { className: "detail-label" }, "LAST ACTIVE"), /* @__PURE__ */ _n.createElement("span", { className: "detail-value detail-value-active" }, /* @__PURE__ */ _n.createElement("span", { className: `status-micro-dot ${presence.dotClass}` }), /* @__PURE__ */ _n.createElement("strong", { className: "ago-highlight" }, activeAgo))), /* @__PURE__ */ _n.createElement("div", { className: "detail-block" }, /* @__PURE__ */ _n.createElement("span", { className: "detail-label" }, "SUBSCRIPTION VALIDITY"), /* @__PURE__ */ _n.createElement("span", { className: "detail-value", style: { color: exp.badgeColor } }, exp.detail))),
    watching && device.currentTitle ? /* @__PURE__ */ _n.createElement("div", { className: "now-watching-banner" }, /* @__PURE__ */ _n.createElement("div", { className: "now-watching-header" }, /* @__PURE__ */ _n.createElement("div", { className: "now-watching-title-wrap" }, /* @__PURE__ */ _n.createElement(PlayIcon, { size: 13, color: "#E50914" }), /* @__PURE__ */ _n.createElement("span", { className: "now-watching-title" }, device.currentTitle, device.currentEpisode ? ` - ${device.currentEpisode}` : "")), /* @__PURE__ */ _n.createElement("span", { className: "now-watching-pct" }, device.currentProgress || 0, "%")), /* @__PURE__ */ _n.createElement("div", { className: "progress-track" }, /* @__PURE__ */ _n.createElement(
      "div",
      {
        className: "progress-fill",
        style: { width: `${Math.min(100, Math.max(5, device.currentProgress || 0))}%` }
      }
    ))) : !watching && latestWatched && latestWatched.title ? /* @__PURE__ */ _n.createElement("div", { className: "recent-stream-bar" }, /* @__PURE__ */ _n.createElement("div", { className: "recent-stream-info" }, /* @__PURE__ */ _n.createElement("span", { className: "recent-stream-label" }, "RECENT TITLE"), /* @__PURE__ */ _n.createElement("span", { className: "recent-stream-title" }, latestWatched.title), latestWatched.episode ? /* @__PURE__ */ _n.createElement("span", { className: "recent-stream-ep" }, latestWatched.episode) : null, latestWatched.progress ? /* @__PURE__ */ _n.createElement("span", { className: "recent-stream-pct" }, "(", latestWatched.progress, "%)") : null), latestWatched.updatedAt ? /* @__PURE__ */ _n.createElement("span", { className: "recent-stream-ago" }, formatAgo(latestWatched.updatedAt)) : null) : null,
    /* @__PURE__ */ _n.createElement("div", { className: "card-actions" }, /* @__PURE__ */ _n.createElement("div", { className: "action-buttons" }, /* @__PURE__ */ _n.createElement(
      "button",
      {
        type: "button",
        className: "action-btn",
        onClick: (e3) => {
          e3.stopPropagation();
          onOpenHistory(device);
        }
      },
      /* @__PURE__ */ _n.createElement(ClockIcon, { size: 13, color: "#CCCCCC" }),
      /* @__PURE__ */ _n.createElement("span", null, "History (", historyCount, ")")
    ), /* @__PURE__ */ _n.createElement(
      "button",
      {
        type: "button",
        className: "action-btn btn-primary-red",
        onClick: (e3) => {
          e3.stopPropagation();
          onOpenDetails(device.deviceId);
        }
      },
      /* @__PURE__ */ _n.createElement(CheckIcon, { size: 13, color: "#FFFFFF" }),
      /* @__PURE__ */ _n.createElement("span", null, device.status === "approved" ? "Extend Access" : "Activate User")
    ), device.status === "pending" && /* @__PURE__ */ _n.createElement(
      "button",
      {
        type: "button",
        className: "action-btn btn-quick",
        onClick: (e3) => {
          e3.stopPropagation();
          onQuickApprove(device.deviceId);
        }
      },
      /* @__PURE__ */ _n.createElement("span", null, "Quick 1-Mo (\u20B9200)")
    ), device.status === "approved" && /* @__PURE__ */ _n.createElement(
      "button",
      {
        type: "button",
        className: "action-btn btn-revoke",
        onClick: (e3) => {
          e3.stopPropagation();
          onRevoke(device.deviceId);
        }
      },
      /* @__PURE__ */ _n.createElement("span", null, "Pause access")
    )), /* @__PURE__ */ _n.createElement(
      "button",
      {
        type: "button",
        className: "trash-btn",
        title: "Delete device record",
        "aria-label": "Delete device record",
        onClick: (e3) => {
          e3.stopPropagation();
          onDelete(device.deviceId);
        }
      },
      /* @__PURE__ */ _n.createElement(TrashIcon, { size: 14, color: "#888888" })
    ))
  );
};

// src/components/DurationModal.jsx
var DURATION_PRESETS = [
  { id: "3h", label: "Demo for 3hr", subtitle: "Short 3-hour trial demo pass", ms: 3 * 60 * 60 * 1e3, days: "0.125" },
  { id: "24h", label: "24 hr Pass", subtitle: "1-Day standard pass", ms: 24 * 60 * 60 * 1e3, days: "1" },
  { id: "30d", label: "1 Month Subscription Pass", subtitle: "Standard \u20B9200/month plan (30 Days)", ms: 30 * 24 * 60 * 60 * 1e3, days: "30" },
  { id: "180d", label: "6 Month Pass", subtitle: "Half-year pass (180 Days)", ms: 180 * 24 * 60 * 60 * 1e3, days: "180" },
  { id: "perm", label: "No Limit VIP Pass", subtitle: "Permanent unlimited streaming pass", ms: null, days: "permanent" },
  { id: "custom", label: "Custom Option", subtitle: "Set custom number of days", ms: 0, days: "custom" }
];
var DurationModal = ({ device, onClose, onApprove, onRevoke, onSaveNote, approvalPatch: approvalPatch2 }) => {
  const dialogRef = T2(null);
  const [selectedPreset, setSelectedPreset] = d2("30d");
  const [accessMode, setAccessMode] = d2("scheduled");
  const [customDays, setCustomDays] = d2("30");
  const [note, setNote] = d2("");
  const [busy, setBusy] = d2(false);
  const [error, setError] = d2("");
  const handleClose = () => {
    const dialog = dialogRef.current || document.getElementById("details");
    if (dialog) dialog.open = false;
    if (onClose) onClose();
  };
  A2(() => {
    const dialog = dialogRef.current || document.getElementById("details");
    if (!dialog) return;
    dialog.showModal = () => {
      dialog.open = true;
    };
    dialog.close = () => {
      dialog.open = false;
      if (onClose) onClose();
    };
    if (device) {
      dialog.open = true;
      setNote(device.note || "");
      const noteEl = document.getElementById("device-note");
      if (noteEl) noteEl.value = device.note || "";
      const modeEl = document.getElementById("access-mode");
      if (!device.expiresAt && device.status === "approved") {
        setSelectedPreset("perm");
        setAccessMode("permanent");
        if (modeEl) modeEl.value = "permanent";
      } else {
        setSelectedPreset("30d");
        setAccessMode("scheduled");
        setCustomDays("30");
        if (modeEl) modeEl.value = "scheduled";
      }
    } else {
      dialog.open = false;
    }
  }, [device, onClose]);
  A2(() => {
    if (!device) return;
    const onPop = () => handleClose();
    const onKeyDown = (e3) => {
      if (e3.key === "Escape") handleClose();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [device]);
  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    const modeEl = document.getElementById("access-mode");
    const daysEl = document.getElementById("access-days");
    const fieldEl = document.getElementById("duration-field");
    if (preset.id === "perm") {
      setAccessMode("permanent");
      if (modeEl) modeEl.value = "permanent";
      if (fieldEl) fieldEl.hidden = true;
    } else if (preset.id === "custom") {
      setAccessMode("scheduled");
      if (modeEl) modeEl.value = "scheduled";
      if (fieldEl) fieldEl.hidden = false;
    } else {
      setAccessMode("scheduled");
      setCustomDays(String(Math.round(Number(preset.days))));
      if (modeEl) modeEl.value = "scheduled";
      if (daysEl) daysEl.value = String(Math.round(Number(preset.days)));
      if (fieldEl) fieldEl.hidden = true;
    }
  };
  const handleSave = async () => {
    const currentDev = device || (typeof window !== "undefined" ? window._activeDevice : null);
    if (!currentDev) return;
    setBusy(true);
    setError("");
    try {
      const mode = typeof document !== "undefined" && document.getElementById("access-mode")?.value || accessMode;
      const days = mode === "permanent" ? void 0 : Number(typeof document !== "undefined" && document.getElementById("access-days")?.value || customDays) || 30;
      const patch = approvalPatch2(mode, days);
      await onApprove(currentDev.deviceId, patch);
      handleClose();
    } catch (err) {
      setError(err.message || "Failed to apply access pass.");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ _n.createElement(
    "dialog",
    {
      id: "details",
      ref: dialogRef,
      className: "sub-modal",
      open: Boolean(device),
      style: { display: device ? "flex" : "none" },
      onClick: (e3) => {
        if (e3.target === dialogRef.current) handleClose();
      }
    },
    /* @__PURE__ */ _n.createElement("div", { className: "sub-modal-card", onClick: (e3) => e3.stopPropagation() }, /* @__PURE__ */ _n.createElement("div", { className: "sub-modal-header" }, /* @__PURE__ */ _n.createElement("div", null, /* @__PURE__ */ _n.createElement("span", { className: "sub-modal-eyebrow" }, "DEVICE AUTHORIZATION"), /* @__PURE__ */ _n.createElement("h2", { id: "detail-name", className: "sub-modal-title" }, device ? device.name || device.deviceId : "Device Details")), /* @__PURE__ */ _n.createElement("button", { type: "button", className: "close-sub-modal-btn", onClick: handleClose, "aria-label": "Close dialog" }, /* @__PURE__ */ _n.createElement(CloseIcon, { size: 16, color: "#888888" }))), /* @__PURE__ */ _n.createElement("div", { className: "sub-modal-body" }, /* @__PURE__ */ _n.createElement("p", { className: "sub-modal-sub" }, "Choose a subscription duration pass for this device. Approvals are bound to the device identity permanently."), /* @__PURE__ */ _n.createElement("div", { id: "presets-grid", className: "duration-presets-grid" }, DURATION_PRESETS.map((preset) => {
      const isTarget = selectedPreset === preset.id;
      return /* @__PURE__ */ _n.createElement(
        "div",
        {
          key: preset.id,
          className: `duration-option ${isTarget ? "active" : ""}`,
          "data-days": preset.days,
          onClick: () => handleSelectPreset(preset)
        },
        /* @__PURE__ */ _n.createElement("div", { className: "duration-info" }, /* @__PURE__ */ _n.createElement("strong", { className: "duration-label" }, preset.label), /* @__PURE__ */ _n.createElement("span", { className: "duration-sub" }, preset.subtitle)),
        isTarget && /* @__PURE__ */ _n.createElement(CheckIcon, { size: 14, color: "#E50914" })
      );
    })), /* @__PURE__ */ _n.createElement("div", { className: "access-mode-row", hidden: true }, /* @__PURE__ */ _n.createElement(
      "select",
      {
        id: "access-mode",
        value: accessMode,
        onChange: (e3) => {
          setAccessMode(e3.target.value);
          handleSelectPreset(e3.target.value === "permanent" ? DURATION_PRESETS[4] : DURATION_PRESETS[2]);
        }
      },
      /* @__PURE__ */ _n.createElement("option", { value: "permanent" }, "Permanent access"),
      /* @__PURE__ */ _n.createElement("option", { value: "scheduled" }, "Scheduled access")
    )), /* @__PURE__ */ _n.createElement(
      "div",
      {
        id: "duration-field",
        className: "custom-days-box",
        hidden: selectedPreset !== "custom"
      },
      /* @__PURE__ */ _n.createElement("label", { htmlFor: "access-days", className: "pin-label" }, "CUSTOM DURATION (DAYS)"),
      /* @__PURE__ */ _n.createElement("div", { className: "custom-days-row" }, /* @__PURE__ */ _n.createElement(
        "input",
        {
          id: "access-days",
          type: "number",
          min: "1",
          max: "3650",
          value: customDays,
          onChange: (e3) => setCustomDays(e3.target.value),
          className: "custom-days-input"
        }
      ), /* @__PURE__ */ _n.createElement("span", { className: "unit-label" }, "Days"))
    ), /* @__PURE__ */ _n.createElement("div", { className: "note-field-wrap", style: { marginTop: "12px" } }, /* @__PURE__ */ _n.createElement("label", { htmlFor: "device-note", className: "pin-label" }, "PRIVATE NOTE"), /* @__PURE__ */ _n.createElement(
      "textarea",
      {
        id: "device-note",
        value: note,
        onChange: (e3) => setNote(e3.target.value),
        placeholder: "Private note...",
        className: "pin-input",
        style: { width: "100%", height: "60px", marginTop: "4px" },
        rows: 2
      }
    ), /* @__PURE__ */ _n.createElement("div", { style: { marginTop: "6px", textAlign: "right" } }, /* @__PURE__ */ _n.createElement(
      "button",
      {
        type: "button",
        className: "btn-secondary",
        onClick: async () => {
          const currentDev = device || (typeof window !== "undefined" ? window._activeDevice : null);
          const noteVal = (document.getElementById("device-note")?.value !== void 0 ? document.getElementById("device-note").value : note) || "";
          if (currentDev && onSaveNote) {
            await onSaveNote(currentDev.deviceId, noteVal);
          }
        }
      },
      "Save note"
    ))), error && /* @__PURE__ */ _n.createElement("p", { id: "detail-error", className: "pin-error" }, error)), /* @__PURE__ */ _n.createElement("div", { className: "sub-modal-footer" }, /* @__PURE__ */ _n.createElement(
      "button",
      {
        id: "revoke",
        type: "button",
        className: "btn-danger-outline",
        onClick: () => {
          if (device && onRevoke) onRevoke(device.deviceId);
        }
      },
      "Pause access"
    ), /* @__PURE__ */ _n.createElement(
      "button",
      {
        id: "approve",
        type: "button",
        className: "btn-primary-red",
        onClick: handleSave,
        disabled: busy
      },
      /* @__PURE__ */ _n.createElement(CheckIcon, { size: 14, color: "#FFFFFF" }),
      /* @__PURE__ */ _n.createElement("span", null, "Approve device")
    )))
  );
};

// src/components/HistoryModal.jsx
var HistoryModal = ({ device, onClose, relativeTime: relativeTime2 }) => {
  const dialogRef = T2(null);
  const handleClose = () => {
    const dialog = dialogRef.current || document.getElementById("history-modal");
    if (dialog) dialog.open = false;
    if (onClose) onClose();
  };
  A2(() => {
    const dialog = dialogRef.current || document.getElementById("history-modal");
    if (!dialog) return;
    dialog.showModal = () => {
      dialog.open = true;
    };
    dialog.close = () => {
      dialog.open = false;
      if (onClose) onClose();
    };
    dialog.open = Boolean(device);
  }, [device, onClose]);
  A2(() => {
    if (!device) return;
    const onPop = () => handleClose();
    const onKeyDown = (e3) => {
      if (e3.key === "Escape") handleClose();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [device]);
  const history = device && Array.isArray(device.watchHistory) ? device.watchHistory : [];
  return /* @__PURE__ */ _n.createElement(
    "dialog",
    {
      id: "history-modal",
      ref: dialogRef,
      className: "sub-modal",
      open: Boolean(device),
      style: { display: device ? "flex" : "none" },
      onClick: (e3) => {
        if (e3.target === dialogRef.current) handleClose();
      }
    },
    /* @__PURE__ */ _n.createElement("div", { className: "sub-modal-card history-modal-card", onClick: (e3) => e3.stopPropagation() }, /* @__PURE__ */ _n.createElement("div", { className: "sub-modal-header" }, /* @__PURE__ */ _n.createElement("div", null, /* @__PURE__ */ _n.createElement("span", { className: "sub-modal-eyebrow" }, "VIEWING ACTIVITY"), /* @__PURE__ */ _n.createElement("h2", { id: "history-device-name", className: "sub-modal-title" }, device ? device.name || device.deviceId : "Watch History")), /* @__PURE__ */ _n.createElement("button", { type: "button", className: "close-sub-modal-btn", onClick: handleClose, "aria-label": "Close history" }, /* @__PURE__ */ _n.createElement(CloseIcon, { size: 16, color: "#888888" }))), /* @__PURE__ */ _n.createElement("div", { id: "history-list", className: "history-list" }, history.length === 0 ? /* @__PURE__ */ _n.createElement("p", { className: "empty-state" }, "No viewing history recorded for this device.") : history.map((item, idx) => /* @__PURE__ */ _n.createElement("div", { key: `${item.title}-${idx}`, className: "history-row" }, item.poster ? /* @__PURE__ */ _n.createElement("img", { src: item.poster, alt: item.title, className: "history-thumb" }) : /* @__PURE__ */ _n.createElement("div", { className: "history-thumb-placeholder" }, /* @__PURE__ */ _n.createElement(PlayIcon, { size: 14, color: "#666666" })), /* @__PURE__ */ _n.createElement("div", { className: "history-info" }, /* @__PURE__ */ _n.createElement("span", { className: "history-title" }, item.title || "Untitled"), item.episode && /* @__PURE__ */ _n.createElement("span", { className: "history-ep" }, item.episode), /* @__PURE__ */ _n.createElement("div", { className: "history-progress-meta" }, /* @__PURE__ */ _n.createElement("span", { className: "history-progress-pct" }, "Progress: ", item.progress || 0, "%"), item.updatedAt && /* @__PURE__ */ _n.createElement("span", { className: "history-date" }, relativeTime2(item.updatedAt))), /* @__PURE__ */ _n.createElement("div", { className: "progress-track" }, /* @__PURE__ */ _n.createElement(
      "div",
      {
        className: "progress-fill",
        style: { width: `${Math.min(100, Math.max(5, item.progress || 0))}%` }
      }
    )))))), /* @__PURE__ */ _n.createElement("div", { className: "history-footer" }, /* @__PURE__ */ _n.createElement("span", { id: "history-count-text" }, history.length, " title", history.length === 1 ? "" : "s", " recorded"), /* @__PURE__ */ _n.createElement("button", { type: "button", className: "btn-secondary-dark", onClick: handleClose }, "Done")))
  );
};

// src/components/WhitelistTab.jsx
var WhitelistTab = ({ hidden = false, whitelistedIps, onAddIp, onRemoveIp }) => {
  const [ipInput, setIpInput] = d2("");
  const [busy, setBusy] = d2(false);
  const handleAdd = async (e3) => {
    e3.preventDefault();
    const clean = ipInput.trim() || document.getElementById("manual-ip-input")?.value?.trim();
    if (!clean) return;
    setBusy(true);
    try {
      await onAddIp(clean);
      setIpInput("");
      const inputEl = document.getElementById("manual-ip-input");
      if (inputEl) inputEl.value = "";
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ _n.createElement("div", { id: "view-whitelist", className: "tab-section", hidden }, /* @__PURE__ */ _n.createElement("div", { className: "section-header" }, /* @__PURE__ */ _n.createElement("h2", { className: "section-title" }, "Network IP Whitelist"), /* @__PURE__ */ _n.createElement("p", { className: "section-desc" }, "Devices connecting from whitelisted IP addresses bypass device authorization gates automatically.")), /* @__PURE__ */ _n.createElement("form", { className: "whitelist-input-row", onSubmit: handleAdd }, /* @__PURE__ */ _n.createElement(
    "input",
    {
      id: "manual-ip-input",
      type: "text",
      value: ipInput,
      onChange: (e3) => setIpInput(e3.target.value),
      placeholder: "Enter IP address (e.g. 152.58.63.170)",
      className: "ip-input",
      disabled: busy
    }
  ), /* @__PURE__ */ _n.createElement(
    "button",
    {
      id: "add-ip-btn",
      type: "button",
      className: "btn-primary-red",
      onClick: handleAdd,
      disabled: busy
    },
    /* @__PURE__ */ _n.createElement(CheckIcon, { size: 14, color: "#FFFFFF" }),
    /* @__PURE__ */ _n.createElement("span", null, "Add IP")
  )), /* @__PURE__ */ _n.createElement("div", { id: "whitelist-list", className: "whitelist-list" }, whitelistedIps.length === 0 ? /* @__PURE__ */ _n.createElement("div", { className: "empty-state" }, /* @__PURE__ */ _n.createElement("p", null, "No whitelisted IP addresses. Add an IP above to grant automatic network access.")) : whitelistedIps.map((ip) => /* @__PURE__ */ _n.createElement("div", { key: ip, className: "ip-item" }, /* @__PURE__ */ _n.createElement("span", { className: "ip-text" }, ip), /* @__PURE__ */ _n.createElement(
    "button",
    {
      type: "button",
      className: "action-btn btn-revoke",
      onClick: () => onRemoveIp(ip),
      title: "Remove IP"
    },
    /* @__PURE__ */ _n.createElement(TrashIcon, { size: 13, color: "#FF6B6B" }),
    /* @__PURE__ */ _n.createElement("span", null, "Remove")
  )))));
};

// src/components/SecurityPinTab.jsx
var SecurityPinTab = ({ hidden = false, onUpdatePin, onLock }) => {
  const [notice, setNotice] = d2(null);
  const [busy, setBusy] = d2(false);
  const handleSubmit = async (e3) => {
    if (e3) {
      if (e3._meflixHandled) return;
      e3._meflixHandled = true;
      if (e3.preventDefault) e3.preventDefault();
    }
    setNotice(null);
    const errEl = document.getElementById("pin-error");
    if (errEl) errEl.textContent = "";
    const curEl = document.getElementById("current-pin");
    const npEl = document.getElementById("new-pin");
    const cpEl = document.getElementById("confirm-pin");
    const cur = (curEl?.value || "").trim();
    const np = (npEl?.value || "").trim();
    const cp = (cpEl?.value || "").trim();
    if (!np || np.length !== 4 || !/^\d{4}$/.test(np)) {
      const msg = "Please enter a valid 4-digit PIN.";
      setNotice({ text: msg, isError: true });
      if (errEl) errEl.textContent = msg;
      return;
    }
    if (np !== cp) {
      const msg = "PINs do not match";
      setNotice({ text: msg, isError: true });
      if (errEl) errEl.textContent = msg;
      return;
    }
    setBusy(true);
    try {
      let serverChanged = false;
      if (typeof fetch === "function") {
        try {
          const res = await fetch("/api/admin/pin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPin: cur, newPin: np })
          });
          if (res && res.ok) {
            const data = await res.json();
            if (data && data.changed) {
              serverChanged = true;
            }
          }
        } catch {
        }
      }
      if (onUpdatePin) {
        await onUpdatePin(cur, np, serverChanged);
      }
      setNotice({ text: "PIN successfully updated in Firebase!", isError: false });
      if (errEl) errEl.textContent = "PIN successfully updated in Firebase!";
      if (npEl) npEl.value = "";
      if (cpEl) cpEl.value = "";
      if (curEl) curEl.value = "";
      try {
        sessionStorage.removeItem("meflix_admin_auth");
      } catch {
      }
      const ws = document.getElementById("workspace");
      if (ws) ws.hidden = true;
      const lk = document.getElementById("lock");
      if (lk) lk.hidden = false;
      if (onLock) onLock("PIN changed. Unlock using your new PIN.");
    } catch (err) {
      const msg = err.message || "Failed to update PIN.";
      setNotice({ text: msg, isError: true });
      if (errEl) errEl.textContent = msg;
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ _n.createElement("div", { id: "view-pin", className: "tab-section", hidden }, /* @__PURE__ */ _n.createElement("div", { className: "section-header" }, /* @__PURE__ */ _n.createElement("h2", { className: "section-title" }, "Update Administrator PIN"), /* @__PURE__ */ _n.createElement("p", { className: "section-desc" }, "Set a secure 4-digit PIN to protect the admin console. Changing your PIN updates Firestore directly.")), /* @__PURE__ */ _n.createElement("div", { className: "pin-card-wrapper" }, /* @__PURE__ */ _n.createElement(
    "form",
    {
      id: "pin-form",
      ref: (form) => {
        if (form && !form._hasNativeSubmit) {
          form._hasNativeSubmit = true;
          form.addEventListener("submit", (e3) => {
            e3.preventDefault();
            handleSubmit(e3);
          });
        }
      },
      onSubmit: handleSubmit,
      className: "pin-update-form"
    },
    /* @__PURE__ */ _n.createElement("div", { className: "pin-field-group" }, /* @__PURE__ */ _n.createElement("label", { htmlFor: "current-pin", className: "pin-label" }, "CURRENT PIN"), /* @__PURE__ */ _n.createElement(
      "input",
      {
        id: "current-pin",
        type: "password",
        inputMode: "numeric",
        maxLength: 4,
        defaultValue: "",
        placeholder: "Enter current PIN",
        className: "pin-input",
        disabled: busy
      }
    )),
    /* @__PURE__ */ _n.createElement("div", { className: "pin-field-group" }, /* @__PURE__ */ _n.createElement("label", { htmlFor: "new-pin", className: "pin-label" }, "NEW 4-DIGIT PIN"), /* @__PURE__ */ _n.createElement(
      "input",
      {
        id: "new-pin",
        type: "password",
        inputMode: "numeric",
        maxLength: 4,
        defaultValue: "",
        placeholder: "Enter new 4-digit PIN",
        className: "pin-input",
        disabled: busy
      }
    )),
    /* @__PURE__ */ _n.createElement("div", { className: "pin-field-group" }, /* @__PURE__ */ _n.createElement("label", { htmlFor: "confirm-pin", className: "pin-label" }, "CONFIRM NEW PIN"), /* @__PURE__ */ _n.createElement(
      "input",
      {
        id: "confirm-pin",
        type: "password",
        inputMode: "numeric",
        maxLength: 4,
        defaultValue: "",
        placeholder: "Re-enter new PIN",
        className: "pin-input",
        disabled: busy
      }
    )),
    /* @__PURE__ */ _n.createElement("p", { id: "pin-error", className: `pin-error ${notice?.isError ? "error" : "success"}` }, notice ? notice.text : ""),
    /* @__PURE__ */ _n.createElement(
      "button",
      {
        id: "save-pin",
        type: "submit",
        className: "btn-save-pin",
        disabled: busy
      },
      /* @__PURE__ */ _n.createElement(CheckIcon, { size: 14, color: "#FFFFFF" }),
      /* @__PURE__ */ _n.createElement("span", null, "Save PIN & Lock Console")
    )
  )));
};

// src/components/ConfirmModal.jsx
var ConfirmModal = ({ title, message, onCancel, onConfirm }) => {
  const dialogRef = T2(null);
  const handleClose = () => {
    const dialog = dialogRef.current || document.getElementById("confirm");
    if (dialog) dialog.open = false;
    if (onCancel) onCancel();
  };
  const handleConfirmAction = async () => {
    const dialog = dialogRef.current || document.getElementById("confirm");
    if (dialog) dialog.open = false;
    if (onConfirm) await onConfirm();
  };
  A2(() => {
    const dialog = dialogRef.current || document.getElementById("confirm");
    if (!dialog) return;
    dialog.showModal = () => {
      dialog.open = true;
    };
    dialog.close = () => {
      dialog.open = false;
      if (onCancel) onCancel();
    };
    dialog.open = Boolean(title);
  }, [title, onCancel]);
  A2(() => {
    if (!title) return;
    const onPop = () => handleClose();
    const onKeyDown = (e3) => {
      if (e3.key === "Escape") handleClose();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [title]);
  return /* @__PURE__ */ _n.createElement(
    "dialog",
    {
      id: "confirm",
      ref: dialogRef,
      className: "sub-modal",
      open: Boolean(title),
      style: { display: title ? "flex" : "none" },
      onClick: (e3) => {
        if (e3.target === dialogRef.current) handleClose();
      }
    },
    /* @__PURE__ */ _n.createElement("div", { className: "sub-modal-card", style: { maxWidth: "380px" }, onClick: (e3) => e3.stopPropagation() }, /* @__PURE__ */ _n.createElement("div", { className: "sub-modal-header" }, /* @__PURE__ */ _n.createElement("h2", { id: "confirm-title", className: "sub-modal-title" }, title), /* @__PURE__ */ _n.createElement("button", { type: "button", className: "close-sub-modal-btn", onClick: handleClose, "aria-label": "Cancel" }, /* @__PURE__ */ _n.createElement(CloseIcon, { size: 16, color: "#888888" }))), /* @__PURE__ */ _n.createElement("div", { className: "sub-modal-body" }, /* @__PURE__ */ _n.createElement("p", { id: "confirm-message", className: "sub-modal-sub", style: { marginTop: "8px" } }, message)), /* @__PURE__ */ _n.createElement("div", { className: "sub-modal-actions", style: { marginTop: "20px" } }, /* @__PURE__ */ _n.createElement(
      "button",
      {
        id: "cancel-confirm",
        type: "button",
        className: "btn-secondary-dark",
        onClick: handleClose
      },
      "Cancel"
    ), /* @__PURE__ */ _n.createElement(
      "button",
      {
        id: "accept-confirm",
        type: "button",
        className: "btn-danger-red",
        onClick: handleConfirmAction
      },
      /* @__PURE__ */ _n.createElement(TrashIcon, { size: 13, color: "#FFFFFF" }),
      /* @__PURE__ */ _n.createElement("span", null, "Confirm")
    )))
  );
};

// public/model.js
function statusOf(device, now = Date.now()) {
  if (device.status === "approved" && device.expiresAt && device.expiresAt <= now) return "expired";
  return ["approved", "pending", "rejected"].includes(device.status) ? device.status : "pending";
}
function filteredDevices(devices, filter, query, now = Date.now()) {
  const term = query.trim().toLocaleLowerCase();
  return devices.filter((d3) => (filter === "all" || (filter === "watching" ? statusOf(d3, now) === "approved" && d3.isWatching && now - (d3.lastActiveAt || 0) < 12e4 : statusOf(d3, now) === filter)) && (!term || [d3.name, d3.deviceId, d3.platform, d3.note, d3.legacyDeviceId].some((value) => String(value || "").toLocaleLowerCase().includes(term)))).sort((a3, b3) => (b3.requestedAt || 0) - (a3.requestedAt || 0));
}
function approvalPatch(mode, days, now = Date.now()) {
  if (mode !== "permanent" && mode !== "scheduled") throw Error("Choose an access mode.");
  if (mode === "scheduled" && (!Number.isInteger(days) || days < 1 || days > 3650)) throw Error("Duration must be 1\u20133650 days.");
  return { status: "approved", approvedAt: now, revokedAt: null, accessMode: mode, expiresAt: mode === "permanent" ? null : now + days * 864e5 };
}
function relativeTime(value, now = Date.now()) {
  if (!value) return "Not recorded";
  const seconds = Math.max(0, Math.floor((now - value) / 1e3));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return new Date(value).toLocaleDateString(void 0, { day: "numeric", month: "short", year: "numeric" });
}
function csvCell(value) {
  let text = String(value ?? "");
  if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

// src/AdminApp.jsx
var isStreaming = (d3) => Boolean(d3.isWatching && d3.lastActiveAt && Date.now() - d3.lastActiveAt < 3e5);
function getFullExpirationDetails(d3, now = Date.now()) {
  if (d3.status === "pending") {
    return { badge: "Pending Approval", cls: "pending", badgeColor: "#FFA726", detail: "Awaiting activation" };
  }
  if (d3.status === "rejected") {
    return { badge: "Access Revoked", cls: "rejected", badgeColor: "#E50914", detail: d3.revokedAt ? `Revoked: ${new Date(d3.revokedAt).toLocaleDateString()}` : "Access disabled" };
  }
  if (!d3.expiresAt) {
    return { badge: "Lifetime VIP", cls: "approved", badgeColor: "#46D369", detail: "Permanent unlimited streaming pass" };
  }
  const diff = d3.expiresAt - now;
  const formattedEnd = new Date(d3.expiresAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  if (diff <= 0) {
    return { badge: "Plan Expired", cls: "rejected", badgeColor: "#E50914", detail: `Expired on ${formattedEnd}` };
  }
  const totalHours = Math.floor(diff / (1e3 * 60 * 60));
  const mins = Math.floor(diff % (1e3 * 60 * 60) / (1e3 * 60));
  const days = Math.floor(totalHours / 24);
  const remainHours = totalHours % 24;
  const remainingText = days >= 1 ? `${days}d ${remainHours}h left` : `${totalHours}h ${mins}m left`;
  return { badge: `Active (${remainingText})`, cls: "approved", badgeColor: "#46D369", detail: `Valid until ${formattedEnd}` };
}
function AdminApp({
  firebase: { app: app2, auth: auth2, db: db2, doc: doc2, getDocFromServer: getDocFromServer2, collection: collection2, onSnapshot: onSnapshot2, updateDoc: updateDoc2, setDoc: setDoc2, deleteDoc: deleteDoc2, signInWithCustomToken }
}) {
  const [authorized, setAuthorized] = d2(() => {
    try {
      if (typeof window !== "undefined" && window.location.search.includes("preview=1")) return true;
      return sessionStorage.getItem("meflix_admin_auth") === "true";
    } catch {
      return false;
    }
  });
  const [devices, setDevices] = d2([]);
  const [whitelistedIps, setWhitelistedIps] = d2([]);
  const [currentTab, setCurrentTab] = d2("all");
  const [searchQuery, setSearchQuery] = d2("");
  const [toastMessage, setToastMessage] = d2(null);
  const [durationTarget, setDurationTarget] = d2(null);
  const [historyTarget, setHistoryTarget] = d2(null);
  const [confirmModalData, setConfirmModalData] = d2(null);
  const handleOpenHistory = b2((d3) => {
    setHistoryTarget(d3);
    const modal = document.getElementById("history-modal");
    if (modal) modal.open = true;
    const nameEl = document.getElementById("history-device-name");
    if (nameEl) nameEl.textContent = d3.name || d3.deviceId;
    const countEl = document.getElementById("history-count-text");
    const history = Array.isArray(d3.watchHistory) ? d3.watchHistory : [];
    if (countEl) countEl.textContent = `${history.length} title${history.length === 1 ? "" : "s"} recorded`;
    const listEl = document.getElementById("history-list");
    if (listEl && history.length > 0) {
      listEl.innerHTML = history.map((item) => `
        <div class="history-row">
          ${item.poster ? `<img src="${item.poster}" alt="${item.title}" class="history-thumb" />` : '<div class="history-thumb-placeholder"></div>'}
          <div class="history-info">
            <span class="history-title">${item.title || "Untitled"}</span>
            ${item.episode ? `<span class="history-ep">${item.episode}</span>` : ""}
            <div class="history-progress-meta">
              <span class="history-progress-pct">Progress: ${item.progress || 0}%</span>
              <span class="history-date">${item.updatedAt ? relativeTime(item.updatedAt) : ""}</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width: ${item.progress || 0}%"></div></div>
          </div>
        </div>
      `).join("");
    }
  }, []);
  const handleOpenDetails = b2((deviceId) => {
    const d3 = devices.find((device) => device.deviceId === deviceId);
    window._activeDevice = d3;
    setDurationTarget(d3);
    const modal = document.getElementById("details");
    if (modal) modal.open = true;
    const nameEl = document.getElementById("detail-name");
    if (nameEl && d3) nameEl.textContent = d3.name || d3.deviceId;
    const noteEl = document.getElementById("device-note");
    if (noteEl && d3) noteEl.value = d3.note || "";
    const modeEl = document.getElementById("access-mode");
    if (modeEl && d3) modeEl.value = !d3.expiresAt && d3.status === "approved" ? "permanent" : "permanent";
  }, [devices]);
  const showToast = b2((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3e3);
  }, []);
  const handleUnlock = b2(() => {
    setAuthorized(true);
    const ws = document.getElementById("workspace");
    if (ws) ws.hidden = false;
    const lk = document.getElementById("lock");
    if (lk) lk.hidden = true;
  }, []);
  const handleLock = b2((msg) => {
    try {
      sessionStorage.removeItem("meflix_admin_auth");
    } catch {
    }
    setAuthorized(false);
    setDevices([]);
    setWhitelistedIps([]);
    setDurationTarget(null);
    setHistoryTarget(null);
    setConfirmModalData(null);
    ["details", "history-modal", "confirm", "updates"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.open = false;
    });
    const ws = document.getElementById("workspace");
    if (ws) ws.hidden = true;
    const lk = document.getElementById("lock");
    if (lk) lk.hidden = false;
    const errEl = document.getElementById("login-error");
    if (errEl && msg) errEl.textContent = msg;
  }, []);
  A2(() => {
    let unsubDevices = null;
    let unsubWhitelist = null;
    try {
      if (typeof onSnapshot2 === "function" && typeof collection2 === "function" && db2) {
        unsubDevices = onSnapshot2(collection2(db2, "device_requests"), { includeMetadataChanges: true }, (snapshot) => {
          if (snapshot && snapshot.docs) {
            const list = snapshot.docs.map((d3) => ({ ...typeof d3.data === "function" ? d3.data() : d3.data, deviceId: d3.id }));
            setDevices(list);
          }
        });
        unsubWhitelist = onSnapshot2(collection2(db2, "whitelisted_ips"), { includeMetadataChanges: true }, (snapshot) => {
          if (snapshot && snapshot.docs) {
            const list = snapshot.docs.map((d3) => {
              const data = typeof d3.data === "function" ? d3.data() : d3.data;
              return data?.ip || d3.id.replace(/_/g, ".");
            });
            setWhitelistedIps(list);
          }
        });
      }
    } catch {
    }
    return () => {
      if (typeof unsubDevices === "function") unsubDevices();
      if (typeof unsubWhitelist === "function") unsubWhitelist();
    };
  }, [db2]);
  const handleQuickApprove = b2(async (deviceId) => {
    const patch = approvalPatch("scheduled", 30);
    await updateDoc2(doc2(db2, "device_requests", deviceId), patch);
    showToast("Activated 1 Month Subscription Pass");
  }, [db2, doc2, updateDoc2, showToast]);
  const handleApproveWithPatch = b2(async (deviceId, patch) => {
    await updateDoc2(doc2(db2, "device_requests", deviceId), patch);
    setDurationTarget(null);
    showToast("Device access pass applied.");
  }, [db2, doc2, updateDoc2, showToast]);
  const handleRevoke = b2((deviceId) => {
    setConfirmModalData({
      title: "Pause Device Access",
      message: "Are you sure you want to pause/reject access for this device? It can be reactivated anytime.",
      onConfirm: async () => {
        await updateDoc2(doc2(db2, "device_requests", deviceId), { status: "rejected", revokedAt: Date.now() });
        setConfirmModalData(null);
        showToast("Device access paused.");
      }
    });
    const confirmEl = document.getElementById("confirm");
    if (confirmEl) confirmEl.open = true;
  }, [db2, doc2, updateDoc2, showToast]);
  const handleDelete = b2((deviceId) => {
    setConfirmModalData({
      title: "Delete Device Record",
      message: "Are you sure you want to delete this device registration? If the user opens the app again, a new request will appear.",
      onConfirm: async () => {
        await deleteDoc2(doc2(db2, "device_requests", deviceId));
        setConfirmModalData(null);
        showToast("Device registration deleted.");
      }
    });
    const confirmEl = document.getElementById("confirm");
    if (confirmEl) confirmEl.open = true;
  }, [db2, doc2, deleteDoc2, showToast]);
  const handleAddWhitelistIp = async (ip) => {
    const cleanIp = ip.trim();
    if (!cleanIp) return;
    const ipDocId = cleanIp.replace(/[\.\:]/g, "_");
    await setDoc2(doc2(db2, "whitelisted_ips", ipDocId), {
      ip: cleanIp,
      addedAt: Date.now(),
      note: "Admin Whitelist"
    }, { merge: true });
    showToast(`Added ${cleanIp} to whitelist.`);
  };
  const handleRemoveWhitelistIp = async (ip) => {
    const ipDocId = ip.replace(/[\.\:]/g, "_");
    await deleteDoc2(doc2(db2, "whitelisted_ips", ipDocId));
    showToast(`Removed ${ip} from whitelist.`);
  };
  const handleUpdatePin = async (currentPin, newPin, serverChanged = false) => {
    if (!serverChanged) {
      let currentTargetPin = "1234";
      let pinVer = 1;
      try {
        const snap1 = await getDocFromServer2(doc2(db2, "app_config", "security"));
        if (snap1 && (typeof snap1.exists === "function" ? snap1.exists() : snap1.exists)) {
          const d1 = typeof snap1.data === "function" ? snap1.data() : snap1.data;
          currentTargetPin = String(d1.pin !== void 0 ? d1.pin : d1.password !== void 0 ? d1.password : "1234").trim();
          pinVer = (d1.pinVersion || 1) + 1;
        }
      } catch {
      }
      if (currentTargetPin === "1234") {
        try {
          const snap2 = await getDocFromServer2(doc2(db2, "admin_settings", "security"));
          if (snap2 && (typeof snap2.exists === "function" ? snap2.exists() : snap2.exists)) {
            const d22 = typeof snap2.data === "function" ? snap2.data() : snap2.data;
            currentTargetPin = String(d22.pin !== void 0 ? d22.pin : d22.password !== void 0 ? d22.password : "1234").trim();
            pinVer = (d22.pinVersion || 1) + 1;
          }
        } catch {
        }
      }
      if (currentPin && currentPin !== currentTargetPin) {
        throw new Error("Current PIN is incorrect.");
      }
      if (newPin.length !== 4) {
        throw new Error("Use exactly 4 digits.");
      }
      const updateData = {
        pin: newPin,
        password: newPin,
        pinVersion: pinVer,
        changedAt: Date.now()
      };
      await Promise.allSettled([
        setDoc2(doc2(db2, "admin_settings", "security"), updateData, { merge: true }),
        setDoc2(doc2(db2, "app_config", "security"), updateData, { merge: true })
      ]);
    }
    showToast("PIN successfully changed.");
    handleLock("PIN changed. Unlock using your new PIN.");
  };
  const handleExport = () => {
    const rows = [
      ["Name", "Device ID", "Platform", "IP", "Status", "Expiry", "Last Active"],
      ...filteredRows.map((d3) => [
        d3.name || "",
        d3.deviceId,
        d3.platform || "",
        d3.ip || "",
        d3.status || "",
        d3.expiresAt ? new Date(d3.expiresAt).toISOString() : "Lifetime VIP",
        d3.lastActiveAt ? new Date(d3.lastActiveAt).toISOString() : ""
      ])
    ];
    const csvContent = rows.map((r3) => r3.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `meflix-devices-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Devices exported to CSV.");
  };
  const filteredRows = w2(() => {
    return filteredDevices(devices, currentTab, searchQuery);
  }, [devices, currentTab, searchQuery]);
  const streamingCount = w2(() => {
    return devices.filter(isStreaming).length;
  }, [devices]);
  const isDeviceView = currentTab === "all" || currentTab === "watching" || currentTab === "pending";
  return /* @__PURE__ */ _n.createElement(_n.Fragment, null, /* @__PURE__ */ _n.createElement(
    LockScreen,
    {
      hidden: authorized,
      onUnlock: handleUnlock,
      db: db2,
      doc: doc2,
      getDocFromServer: getDocFromServer2,
      auth: auth2,
      signInWithCustomToken
    }
  ), /* @__PURE__ */ _n.createElement("div", { id: "workspace", className: "workspace", hidden: !authorized }, /* @__PURE__ */ _n.createElement("div", { className: "modal-card" }, /* @__PURE__ */ _n.createElement(
    TopBar,
    {
      streamingCount,
      onRefresh: () => showToast("Syncing with Firebase..."),
      onLock: () => handleLock(),
      onExport: handleExport
    }
  ), /* @__PURE__ */ _n.createElement("main", { className: "main-content" }, /* @__PURE__ */ _n.createElement(
    StatsRow,
    {
      devices,
      whitelistedIps,
      currentTab,
      onSelectTab: setCurrentTab,
      isStreaming
    }
  ), /* @__PURE__ */ _n.createElement(
    NavTabs,
    {
      currentTab,
      onSelectTab: setCurrentTab,
      totalCount: devices.length,
      streamingCount,
      pendingCount: devices.filter((d3) => d3.status === "pending").length,
      whitelistCount: whitelistedIps.length,
      searchQuery,
      onSearchChange: setSearchQuery,
      isDeviceView
    }
  ), /* @__PURE__ */ _n.createElement("div", { className: "content-body" }, /* @__PURE__ */ _n.createElement("div", { id: "view-devices", className: "device-list-container", hidden: !isDeviceView }, /* @__PURE__ */ _n.createElement("div", { className: "list-meta-bar" }, /* @__PURE__ */ _n.createElement("span", { id: "result-count", className: "result-count-label" }, filteredRows.length, " ", filteredRows.length === 1 ? "device" : "devices"), /* @__PURE__ */ _n.createElement("span", { className: "sub-policy-hint" }, currentTab === "watching" ? "Active streaming sessions in real-time" : "Device-bound permanent access")), /* @__PURE__ */ _n.createElement("div", { id: "device-list", className: "device-cards-grid" }, filteredRows.length === 0 ? /* @__PURE__ */ _n.createElement("div", { className: "empty-state" }, /* @__PURE__ */ _n.createElement("p", null, devices.length ? searchQuery ? `No matches found for "${searchQuery}"` : "No devices in this category." : "No devices registered yet. Installation requests appear here automatically.")) : filteredRows.map((device) => /* @__PURE__ */ _n.createElement(
    DeviceCard,
    {
      key: device.deviceId,
      device,
      isStreaming,
      expirationDetails: getFullExpirationDetails(device),
      relativeTime,
      onOpenDetails: handleOpenDetails,
      onOpenHistory: handleOpenHistory,
      onQuickApprove: handleQuickApprove,
      onRevoke: handleRevoke,
      onDelete: handleDelete
    }
  )))), /* @__PURE__ */ _n.createElement(
    WhitelistTab,
    {
      hidden: currentTab !== "whitelist",
      whitelistedIps,
      onAddIp: handleAddWhitelistIp,
      onRemoveIp: handleRemoveWhitelistIp
    }
  ), /* @__PURE__ */ _n.createElement(
    SecurityPinTab,
    {
      hidden: currentTab !== "pin",
      onUpdatePin: handleUpdatePin,
      onLock: handleLock
    }
  ))), /* @__PURE__ */ _n.createElement(
    DurationModal,
    {
      device: durationTarget,
      onClose: () => setDurationTarget(null),
      onApprove: handleApproveWithPatch,
      onRevoke: handleRevoke,
      onSaveNote: async (deviceId, noteText) => {
        await updateDoc2(doc2(db2, "device_requests", deviceId), { note: noteText });
        showToast("Note saved.");
      },
      approvalPatch
    }
  ), /* @__PURE__ */ _n.createElement(
    HistoryModal,
    {
      device: historyTarget,
      onClose: () => setHistoryTarget(null),
      relativeTime
    }
  ), /* @__PURE__ */ _n.createElement(
    ConfirmModal,
    {
      title: confirmModalData?.title,
      message: confirmModalData?.message,
      onCancel: () => setConfirmModalData(null),
      onConfirm: confirmModalData?.onConfirm
    }
  ), /* @__PURE__ */ _n.createElement("dialog", { id: "updates", className: "sub-modal", style: { display: "none" } }, /* @__PURE__ */ _n.createElement(
    "form",
    {
      id: "release-form",
      onSubmit: async (e3) => {
        e3.preventDefault();
        const target = document.getElementById("release-platform")?.value || "tv";
        const code = Number(document.getElementById("release-code")?.value) || 1;
        const url = document.getElementById("release-url")?.value || "";
        const notes = document.getElementById("release-notes")?.value || "";
        const force = document.getElementById("release-force")?.checked || false;
        await setDoc2(doc2(db2, "app_config", `version_${target}`), {
          platform: target,
          versionCode: code,
          apkUrl: url,
          changelog: notes.split("\n").map((s3) => s3.trim()).filter(Boolean),
          isForceUpdate: force
        }, { merge: true });
      }
    },
    /* @__PURE__ */ _n.createElement("select", { id: "release-platform" }, /* @__PURE__ */ _n.createElement("option", { value: "tv" }, "Fire TV")),
    /* @__PURE__ */ _n.createElement("input", { id: "release-name" }),
    /* @__PURE__ */ _n.createElement("input", { id: "release-code", type: "number" }),
    /* @__PURE__ */ _n.createElement("input", { id: "release-url", type: "url" }),
    /* @__PURE__ */ _n.createElement("textarea", { id: "release-notes" }),
    /* @__PURE__ */ _n.createElement("input", { id: "release-force", type: "checkbox" }),
    /* @__PURE__ */ _n.createElement("p", { id: "release-error" })
  )), toastMessage && /* @__PURE__ */ _n.createElement("div", { id: "toast", className: "toast", role: "status" }, toastMessage))));
}

// src/index.jsx
if (typeof queueMicrotask === "undefined") {
  const qm = (fn2) => Promise.resolve().then(fn2);
  try {
    window.queueMicrotask = qm;
  } catch {
  }
  try {
    globalThis.queueMicrotask = qm;
  } catch {
  }
}
var safeInitApp = typeof initializeApp === "function" ? initializeApp : typeof _initApp !== "undefined" ? _initApp : null;
var safeGetAuth = typeof getAuth === "function" ? getAuth : typeof _getAuth !== "undefined" ? _getAuth : null;
var safeSignInAnon = typeof signInAnonymously === "function" ? signInAnonymously : typeof _signInAnon !== "undefined" ? _signInAnon : null;
var safeGetFirestore = typeof getFirestore === "function" ? getFirestore : typeof _getFirestore !== "undefined" ? _getFirestore : null;
var safeDoc = typeof doc === "function" ? doc : typeof _doc !== "undefined" ? _doc : null;
var safeGetDoc = typeof getDocFromServer === "function" ? getDocFromServer : typeof _getDocFromServer !== "undefined" ? _getDocFromServer : null;
var safeCollection = typeof collection === "function" ? collection : typeof _collection !== "undefined" ? _collection : null;
var safeOnSnapshot = typeof onSnapshot === "function" ? onSnapshot : typeof _onSnapshot !== "undefined" ? _onSnapshot : null;
var safeUpdateDoc = typeof updateDoc === "function" ? updateDoc : typeof _updateDoc !== "undefined" ? _updateDoc : null;
var safeSetDoc = typeof setDoc === "function" ? setDoc : typeof _setDoc !== "undefined" ? _setDoc : null;
var safeDeleteDoc = typeof deleteDoc === "function" ? deleteDoc : typeof _deleteDoc !== "undefined" ? _deleteDoc : null;
var safeFbConfig = typeof firebaseConfig !== "undefined" ? firebaseConfig : typeof _fbConfig !== "undefined" ? _fbConfig : {};
var app = safeInitApp ? safeInitApp(safeFbConfig) : null;
var auth = safeGetAuth ? safeGetAuth(app) : null;
var db = safeGetFirestore ? safeGetFirestore(app) : null;
try {
  if (typeof safeSignInAnon === "function" && auth) {
    safeSignInAnon(auth).catch(() => {
    });
  }
} catch {
}
var rootElement = document.getElementById("root");
if (rootElement) {
  q3(
    /* @__PURE__ */ _n.createElement(
      AdminApp,
      {
        firebase: {
          app,
          auth,
          db,
          doc: safeDoc,
          getDocFromServer: safeGetDoc,
          collection: safeCollection,
          onSnapshot: safeOnSnapshot,
          updateDoc: safeUpdateDoc,
          setDoc: safeSetDoc,
          deleteDoc: safeDeleteDoc
        }
      }
    ),
    rootElement
  );
}
