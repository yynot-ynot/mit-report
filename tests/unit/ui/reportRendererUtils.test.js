import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAvailableMitigationOverlayState,
  buildAvailableMitigationResourceLabels,
} from "../../../js/ui/reportRendererUtils.js";

/**
 * Scenario:
 *   The Available Mit overlay should show the full Paladin resource label, not
 *   a shorthand token, whenever row-level resource state includes `oathGauge`.
 *
 * Expectations:
 *   - The helper returns exactly one visible label for Paladin Oath.
 *   - The wording includes the full resource name and max-value context.
 */
test("buildAvailableMitigationResourceLabels formats Oath Gauge text", () => {
  assert.deepEqual(buildAvailableMitigationResourceLabels({ oathGauge: 45 }), [
    "Oath Gauge: 45 / 100",
  ]);
});

/**
 * Scenario:
 *   Players without supported tracked resource state should not render any
 *   resource labels in the Available Mit overlay.
 *
 * Expectations:
 *   - Null, empty, or unrelated objects all produce an empty label list.
 *   - This keeps the renderer free to omit the resource section entirely when
 *     analysis did not persist any tracked resource values for the player.
 */
test("buildAvailableMitigationResourceLabels ignores empty resource state", () => {
  assert.deepEqual(buildAvailableMitigationResourceLabels(null), []);
  assert.deepEqual(buildAvailableMitigationResourceLabels({}), []);
  assert.deepEqual(
    buildAvailableMitigationResourceLabels({ unrelated: 10 }),
    []
  );
});

/**
 * Scenario:
 *   A Paladin (or any future supported job resource) may have tracked resource
 *   data even when no mitigation abilities are currently available. In that
 *   case the UI should still render a muted placeholder dot so users have a
 *   hover target for the tooltip.
 *
 * Expectations:
 *   - The overlay is rendered because resource data exists.
 *   - No mitigation dots are available, so the placeholder trigger is enabled.
 *   - The resource label text is preserved for tooltip rendering.
 */
test("buildAvailableMitigationOverlayState enables placeholder dot for resource-only rows", () => {
  assert.deepEqual(
    buildAvailableMitigationOverlayState([], { oathGauge: 45 }),
    {
      resourceLabels: ["Oath Gauge: 45 / 100"],
      shouldRenderLayer: true,
      shouldRenderPlaceholderDot: true,
    }
  );
});

/**
 * Scenario:
 *   Jobs without tracked resource data should not gain a synthetic hover target
 *   when they also have no available mitigation abilities.
 *
 * Expectations:
 *   - No layer is rendered when both mitigation and resource inputs are empty.
 *   - The placeholder-dot path remains resource-driven rather than hardcoded to
 *     specific jobs.
 */
test("buildAvailableMitigationOverlayState omits placeholder dot without resource data", () => {
  assert.deepEqual(buildAvailableMitigationOverlayState([], null), {
    resourceLabels: [],
    shouldRenderLayer: false,
    shouldRenderPlaceholderDot: false,
  });
});

/**
 * Scenario:
 *   When a player has both tracked resource data and available mitigation
 *   abilities, the normal mitigation-dot overlay should be used and the
 *   placeholder dot must stay disabled.
 *
 * Expectations:
 *   - The layer renders because mitigation/resource data exists.
 *   - The placeholder flag is false because real mitigation dots are present.
 */
test("buildAvailableMitigationOverlayState disables placeholder dot when mitigation dots exist", () => {
  assert.deepEqual(
    buildAvailableMitigationOverlayState(["Holy Sheltron"], { oathGauge: 50 }),
    {
      resourceLabels: ["Oath Gauge: 50 / 100"],
      shouldRenderLayer: true,
      shouldRenderPlaceholderDot: false,
    }
  );
});
