from decimal import Decimal

from app.services.sarafi_af_rates import parse_sarai_shahzada_rates

SAMPLE_HTML = """
<table class="homeRates exchangeRatesTable mb-4">
  <thead><tr><th>Currency</th><th>Buy</th><th>Sell</th></tr></thead>
  <tbody>
    <tr>
      <td><a href="/exchange-rates/sarai-shahzada/USD-AFN"><b>USD - US Dollar</b></a></td>
      <td><b class="buyRate">64.60</b></td>
      <td><b class="sellRate">64.65</b></td>
    </tr>
    <tr>
      <td><a href="/exchange-rates/sarai-shahzada/EUR-AFN"><b>EUR - Euro</b></a></td>
      <td><b class="buyRate">73.80</b></td>
      <td><b class="sellRate">74.00</b></td>
    </tr>
    <tr>
      <td><a href="/exchange-rates/sarai-shahzada/IRR-AFN"><b>IRR - Iranian Rial <sup>1K</sup></b></a></td>
      <td><b class="buyRate">0.30</b></td>
      <td><b class="sellRate">0.31</b></td>
    </tr>
  </tbody>
</table>
"""


def test_parse_sarai_shahzada_rates() -> None:
    rates = parse_sarai_shahzada_rates(SAMPLE_HTML)
    assert len(rates) == 3
    assert rates[0].code == "USD"
    assert rates[0].buy_rate == Decimal("64.60")
    assert rates[0].sell_rate == Decimal("64.65")
    assert rates[2].code == "IRR"
    assert rates[2].buy_rate == Decimal("0.30")


def test_parse_sarai_shahzada_rates_missing_table() -> None:
    try:
        parse_sarai_shahzada_rates("<html></html>")
        assert False, "expected ValueError"
    except ValueError as exc:
        assert "table not found" in str(exc)
